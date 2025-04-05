import path from "node:path"

export function destinationPathToFunctionName(destinationPath: string): string {
	const basename = path.basename(destinationPath)

	if (basename.endsWith(".as.mts")) {
		return basename.slice(0, -(".as.mts".length))
	}

	return basename.slice(0, -(".mts".length))
}
