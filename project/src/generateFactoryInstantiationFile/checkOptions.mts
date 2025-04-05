import type {Options} from "./Options.mts"
import {
	destinationPathToFunctionName
} from "./destinationPathToFunctionName.mts"

export function checkOptions(options: Options) {
	if (!options.source.startsWith("project/")) {
		throw new Error(`source must start with project/.`)
	} else if (!options.destination.startsWith("project/")) {
		throw new Error(`destination must start with project/.`)
	}

	const exportName = destinationPathToFunctionName(options.destination)

	if (!exportName.endsWith("Factory")) {
		throw new Error(`destination must end with 'Factory.mts' or 'Factory.as.mts'.`)
	}
}
