//! CLI for the zero-dependency ecology reference engine.
//!
//! Scenario JSON on stdin (a small hand-rolled parser covers exactly this
//! shape — no serde needed):
//! {
//!   "traits": { "thermotolerance": 0.55, ... nine axes ... },
//!   "environment": { "temp_k": 300, "radiation_index": 1.5, "water": 0.6 },
//!   "upkeep": 20,
//!   "config": { "generations": 60, "founders": 100, "mutation_std_dev": 0.4, "seed": 7331, "world_fertility": null }
//! }
//!
//! Writes the simulation result as JSON on stdout, for the parity harness in
//! services/agents/parity/run_parity.py.

use ecology::{simulate, Environment, SimConfig, TraitVector};
use std::io::Read;

#[derive(Debug, Clone)]
#[allow(dead_code)] // the parser is a JSON subset; Arr/Bool/Str exist for completeness
enum Json {
    Null,
    Num(f64),
    Str(String),
    Bool(bool),
    Arr(Vec<Json>),
    Obj(Vec<(String, Json)>),
}

impl Json {
    fn get(&self, key: &str) -> Option<&Json> {
        match self {
            Json::Obj(entries) => entries.iter().find(|(k, _)| k == key).map(|(_, v)| v),
            _ => None,
        }
    }
    /// Fetch a nested node (object/array/scalar) by key.
    fn obj(&self, key: &str) -> Option<&Json> {
        self.get(key)
    }
    /// Fetch a numeric leaf by key.
    fn num(&self, key: &str) -> Option<f64> {
        self.get(key).and_then(|v| match v {
            Json::Num(n) => Some(*n),
            _ => None,
        })
    }
}

struct Parser<'a> {
    bytes: &'a [u8],
    pos: usize,
}

impl<'a> Parser<'a> {
    fn new(s: &'a str) -> Self {
        Self {
            bytes: s.as_bytes(),
            pos: 0,
        }
    }
    fn skip_ws(&mut self) {
        while self.pos < self.bytes.len() && self.bytes[self.pos].is_ascii_whitespace() {
            self.pos += 1;
        }
    }
    fn peek(&self) -> Option<u8> {
        self.bytes.get(self.pos).copied()
    }
    fn expect(&mut self, c: u8) -> Result<(), String> {
        self.skip_ws();
        if self.peek() == Some(c) {
            self.pos += 1;
            Ok(())
        } else {
            Err(format!("expected '{}' at byte {}", c as char, self.pos))
        }
    }
    fn parse(&mut self) -> Result<Json, String> {
        self.skip_ws();
        match self.peek() {
            Some(b'{') => self.parse_object(),
            Some(b'[') => self.parse_array(),
            Some(b'"') => Ok(Json::Str(self.parse_string()?)),
            Some(b't') => self.parse_lit("true", Json::Bool(true)),
            Some(b'f') => self.parse_lit("false", Json::Bool(false)),
            Some(b'n') => self.parse_lit("null", Json::Null),
            Some(c) if c == b'-' || c.is_ascii_digit() => self.parse_number(),
            _ => Err("unexpected end of input".to_string()),
        }
    }
    fn parse_lit(&mut self, lit: &str, value: Json) -> Result<Json, String> {
        if self.bytes[self.pos..].starts_with(lit.as_bytes()) {
            self.pos += lit.len();
            Ok(value)
        } else {
            Err(format!("invalid literal at byte {}", self.pos))
        }
    }
    fn parse_number(&mut self) -> Result<Json, String> {
        let start = self.pos;
        while let Some(c) = self.peek() {
            if c.is_ascii_digit() || matches!(c, b'-' | b'+' | b'.' | b'e' | b'E') {
                self.pos += 1;
            } else {
                break;
            }
        }
        std::str::from_utf8(&self.bytes[start..self.pos])
            .ok()
            .and_then(|s| s.parse::<f64>().ok())
            .map(Json::Num)
            .ok_or_else(|| format!("invalid number at byte {}", start))
    }
    fn parse_string(&mut self) -> Result<String, String> {
        self.expect(b'"')?;
        let mut out = String::new();
        while let Some(c) = self.peek() {
            self.pos += 1;
            match c {
                b'"' => return Ok(out),
                b'\\' => {
                    let esc = self.peek().ok_or("unterminated escape")?;
                    self.pos += 1;
                    out.push(match esc {
                        b'"' => '"',
                        b'\\' => '\\',
                        b'/' => '/',
                        b'n' => '\n',
                        b't' => '\t',
                        b'r' => '\r',
                        other => other as char,
                    });
                }
                _ => out.push(c as char),
            }
        }
        Err("unterminated string".to_string())
    }
    fn parse_array(&mut self) -> Result<Json, String> {
        self.expect(b'[')?;
        let mut items = Vec::new();
        self.skip_ws();
        if self.peek() == Some(b']') {
            self.pos += 1;
            return Ok(Json::Arr(items));
        }
        loop {
            items.push(self.parse()?);
            self.skip_ws();
            match self.peek() {
                Some(b',') => self.pos += 1,
                Some(b']') => {
                    self.pos += 1;
                    return Ok(Json::Arr(items));
                }
                _ => return Err("expected ',' or ']' in array".to_string()),
            }
        }
    }
    fn parse_object(&mut self) -> Result<Json, String> {
        self.expect(b'{')?;
        let mut entries = Vec::new();
        self.skip_ws();
        if self.peek() == Some(b'}') {
            self.pos += 1;
            return Ok(Json::Obj(entries));
        }
        loop {
            let key = self.parse_string()?;
            self.expect(b':')?;
            let value = self.parse()?;
            entries.push((key, value));
            self.skip_ws();
            match self.peek() {
                Some(b',') => self.pos += 1,
                Some(b'}') => {
                    self.pos += 1;
                    return Ok(Json::Obj(entries));
                }
                _ => return Err("expected ',' or '}' in object".to_string()),
            }
        }
    }
}

fn json_escape(s: &str) -> String {
    s.replace('\\', "\\\\")
        .replace('"', "\\\"")
        .replace('\n', "\\n")
}

fn main() {
    let mut buf = String::new();
    std::io::stdin()
        .read_to_string(&mut buf)
        .expect("failed to read scenario JSON from stdin");

    let doc = match Parser::new(&buf).parse() {
        Ok(v) => v,
        Err(e) => {
            eprintln!("scenario must be valid JSON: {e}");
            std::process::exit(2);
        }
    };

    let traits = TraitVector {
        thermotolerance: doc
            .obj("traits")
            .and_then(|t| t.num("thermotolerance"))
            .unwrap_or(0.0),
        radioresistance: doc
            .obj("traits")
            .and_then(|t| t.num("radioresistance"))
            .unwrap_or(0.0),
        photosynthetic_efficiency: doc
            .obj("traits")
            .and_then(|t| t.num("photosynthetic_efficiency"))
            .unwrap_or(0.0),
        osmotic_tolerance: doc
            .obj("traits")
            .and_then(|t| t.num("osmotic_tolerance"))
            .unwrap_or(0.0),
        metabolic_rate: doc
            .obj("traits")
            .and_then(|t| t.num("metabolic_rate"))
            .unwrap_or(0.15),
        pigmentation: doc
            .obj("traits")
            .and_then(|t| t.num("pigmentation"))
            .unwrap_or(0.0),
        spore_formation: doc
            .obj("traits")
            .and_then(|t| t.num("spore_formation"))
            .unwrap_or(0.0),
        nitrogen_fixation: doc
            .obj("traits")
            .and_then(|t| t.num("nitrogen_fixation"))
            .unwrap_or(0.0),
        toxin_production: doc
            .obj("traits")
            .and_then(|t| t.num("toxin_production"))
            .unwrap_or(0.0),
    };
    let environment = Environment {
        temp_k: doc
            .obj("environment")
            .and_then(|e| e.num("temp_k"))
            .unwrap_or(288.0),
        radiation_index: doc
            .obj("environment")
            .and_then(|e| e.num("radiation_index"))
            .unwrap_or(1.0),
        water: doc
            .obj("environment")
            .and_then(|e| e.num("water"))
            .unwrap_or(0.5),
    };
    let config = SimConfig {
        generations: doc
            .obj("config")
            .and_then(|c| c.num("generations"))
            .unwrap_or(60.0) as u32,
        founders: doc
            .obj("config")
            .and_then(|c| c.num("founders"))
            .unwrap_or(100.0) as i64,
        mutation_std_dev: doc
            .obj("config")
            .and_then(|c| c.num("mutation_std_dev"))
            .unwrap_or(0.4),
        seed: doc
            .obj("config")
            .and_then(|c| c.num("seed"))
            .unwrap_or(7331.0) as u64,
        world_fertility: doc
            .obj("config")
            .and_then(|c| match c.get("world_fertility") {
                Some(Json::Num(n)) => Some(*n),
                _ => None,
            }),
    };
    let upkeep = doc.num("upkeep").unwrap_or(0.0);

    let result = simulate(&traits, &environment, upkeep, &config);

    let history = result
        .history
        .iter()
        .map(|h| {
            format!(
                "{{\"generation\":{},\"population\":{},\"mean_fitness\":{}, \"events\":[{}]}}",
                h.generation,
                h.population,
                h.mean_fitness,
                h.events
                    .iter()
                    .map(|e| format!("\"{}\"", json_escape(e)))
                    .collect::<Vec<_>>()
                    .join(",")
            )
        })
        .collect::<Vec<_>>()
        .join(",");

    println!(
        "{{\"history\":[{}],\"outcome\":\"{}\",\"extinct_at\":{},\"peak_population\":{}}}",
        history,
        result.outcome,
        match result.extinct_at {
            Some(g) => g.to_string(),
            None => "null".to_string(),
        },
        result.peak_population
    );
}
