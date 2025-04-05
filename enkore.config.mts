import {defineConfig} from "enkore"
import {defineTargetConfig} from "@enkore-target/js-node"

export default defineConfig({
	target: defineTargetConfig({
		exports: {
			"v0": {
				checkAgainstInterface: [
					"@enkore/spec",
					"EnkoreJSRuntimeAutogenerateAPI_V0_Rev0"
				]
			}
		}
	})
})
