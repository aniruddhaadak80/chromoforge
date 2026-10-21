import { SimTheaterIntro } from "@/components/theater/sim-theater-intro";
import { TheaterWorkspace } from "@/components/theater/theater-workspace";

/**
 * A server component on purpose.
 *
 * The explanation of what the run will do is static prose, so it is rendered
 * on the server and handed to the client island as a slot. The simulation
 * itself still runs in the browser, against the strain on the bench.
 */
export default function TheaterPage() {
  return <TheaterWorkspace intro={<SimTheaterIntro />} />;
}
