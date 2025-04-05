import type {EnkoreSessionAPI} from "@enkore/spec"
import type {
	MyTSFunctionDeclaration,
	__ModuleExport as NodeMyTS
} from "@enkore-types/typescript"
import type {Options} from "./Options.mts"

type Dependency = {
	key: string
	moduleSpecifier: string
	modulePropertyName: string
}

type Ret = {
	implementation: MyTSFunctionDeclaration
	overloads: MyTSFunctionDeclaration[]
	dependencies: Dependency[]
}

export function _getImplementation(
	session: EnkoreSessionAPI,
	nodeMyTS: NodeMyTS,
	options: Options,
	implementationFunctionName: string
): Ret {
	const dependencies: Dependency[] = []

	const {program} = nodeMyTS.createProgram(
		session.project.root, [
			options.source
		], nodeMyTS.readTSConfigFile(
			session.project.root, "tsconfig/base.json"
		).compilerOptions
	)

	const mod = program.getModule(options.source)

	if (!mod.moduleExports.has(implementationFunctionName)) {
		throw new Error(
			`expected '${options.source}' to export a symbol named '${implementationFunctionName}'.`
		)
	}

	const deps = mod.getModuleExportByName("__EnkoreFunctionDependencies", true)

	if (deps && deps.kind === "type") {
		const members = nodeMyTS._getTypeAliasTypeQueryMembers(
			deps.declaration
		)

		for (const member of members) {
			if (!mod.moduleImports.has(member.expression)) continue

			const importDecl = mod.moduleImports.get(member.expression)!

			if (importDecl.kind !== "named") continue

			// this ensures the user doesn't accidentally use the
			// function from the module directly.
			if (!importDecl.isTypeOnly) {
				throw new Error(
					`dependency '${importDecl.moduleSpecifier}' must be import using a type-only import.`
				)
			}

			dependencies.push({
				key: member.property,
				moduleSpecifier: importDecl.moduleSpecifier,
				modulePropertyName: importDecl.members[0].propertyName
			})
		}
	}

	const implementationExport = mod.moduleExports.get(implementationFunctionName)!

	if (implementationExport.kind !== "function") {
		throw new Error(
			`exported symbol '${implementationFunctionName}' must be a function.`
		)
	}

	if (!implementationExport.declarations.length) {
		throw new Error(`Unknown error: declarations is empty.`)
	}

	const {declarations} = implementationExport
	// last declaration is always the implementation
	const implementation = declarations[declarations.length - 1]

	if (!implementation.parameters.length) {
		throw new Error(`implementation must take at least one parameter.`)
	}

	if (implementation.parameters[0].type !== "EnkoreJSRuntimeContext") {
		throw new Error(`first parameter must be of literal type 'EnkoreJSRuntimeContext'.`)
	}

	// todo: cross check overloads?

	return {
		implementation,
		overloads: declarations.slice(
			0,
			declarations.length -1
		),
		// sort for stable code output
		dependencies: dependencies.toSorted((a, b) => {
			let aStr = `${a.key},${a.modulePropertyName},${a.moduleSpecifier}`
			let bStr = `${b.key},${b.modulePropertyName},${b.moduleSpecifier}`

			return aStr.localeCompare(bStr, "en")
		})
	}
}
