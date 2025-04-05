import type {
	__ModuleExport as NodeMyTS,
	MyTSFunctionDeclaration,
	MyTSTopLevelTypeDescriptor
} from "@enkore-types/typescript"

export function generateNeededTypeDeclarations(
	nodeMyTS: NodeMyTS,
	implementation: MyTSFunctionDeclaration
): string {
	const typesNeeded: MyTSTopLevelTypeDescriptor[] = []
	const typesPicked: Map<string, true> = new Map()

	const typeTree = nodeMyTS.getRequiredTopLevelTypesForNode(implementation)

	typeTree.depthFirstTraversal(node => {
		typesNeeded.push(node.getType())
	})

	typesNeeded.reverse()

	let code = ``

	for (const type of typesNeeded) {
		if (type.name === "node()") continue
		if (typesPicked.has(type.name)) continue

		// more complete ignore list:
		// import {
		// 	type EnkoreJSRuntimeContext,
		// 	type EnkoreJSRuntimeContextOptions,
		// 	createContext as enkoreCreateContext
		// } from "@enkore-jsr/runtime/v0"
		if (type.source === "import") {
			if (type.importDeclaration.moduleSpecifier === "@enkore-jsr/runtime/v0") {
				continue
			}
		}

		code += type.declaration.trimEnd()
		code += `\n`

		typesPicked.set(type.name, true)
	}

	return code
}
