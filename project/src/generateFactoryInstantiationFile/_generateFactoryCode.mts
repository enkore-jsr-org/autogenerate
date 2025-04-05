import {type EnkoreSessionAPI} from "@enkore/spec"
import type {Options} from "./Options.mts"
import type {Variant} from "./Variant.mts"
import type {MyTSFunctionDeclaration, __ModuleExport as NodeMyTS} from "@enkore-types/typescript"
import {_getImplementation} from "./_getImplementation.mts"
import {generateNeededTypeDeclarations} from "./generateNeededTypeDeclarations.mts"

function convertPath(path: string) {
	if (path.startsWith("project/src")) {
		return `#~src` + path.slice("project/src".length)
	} else if (path.startsWith("project/export")) {
		return `#~export` + path.slice("project/export".length)
	}

	return path
}

export function _generateFactoryCode(
	session: EnkoreSessionAPI,
	options: Options,
	exportName: string,
	variant: Variant
) {
	const nodeMyTS = session.target.getDependency(
		"@enkore/typescript"
	) as NodeMyTS

	const implementationFunctionName = (
		variant === "syncVariant"
	) ? "__implementationSync" : "__implementation"

	const {implementation, overloads, dependencies} = _getImplementation(
		session, nodeMyTS, options, implementationFunctionName
	)

	const hasDependencies = implementation.parameters[1]?.type === "__EnkoreFunctionDependencies"

	let code = ``

	code += `import {${implementation.name}} from "${convertPath(options.source)}"\n`
	// make sure global symbols are namespaced to not collide with user symbols
	code += `import {\n`
	code += `\ttype EnkoreJSRuntimeContext,\n`
	code += `\ttype EnkoreJSRuntimeContextOptions,\n`
	code += `\tcreateContext as enkoreCreateContext\n`
	code += `} from "@enkore-jsr/runtime/v0"\n`
	code += `\n`
	code += `// vvv--- types needed for implementation\n`
	code += generateNeededTypeDeclarations(nodeMyTS, implementation)
	code += `// ^^^--- types needed for implementation\n`
	code += `\n`

	if (hasDependencies) {
		code += `// vvv--- factories needed for implementation\n`

		for (const [i, dependency] of dependencies.entries()) {
			code += `import {${dependency.modulePropertyName}Factory as __enkoreDep${i}} from "${dependency.moduleSpecifier}"\n`
		}

		code += `// ^^^--- factories needed for implementation\n`
		code += `\n`
	}

	if (!overloads.length) {
		code += functionDeclarationToString(implementation)
	} else {
		for (const overload of overloads) {
			code += functionDeclarationToString(overload)
		}
	}

	code += `\n`
	code += `export function ${exportName}Factory(\n`
	code += `\tctxOrOptions: EnkoreJSRuntimeContext|EnkoreJSRuntimeContextOptions\n`
	code += `): typeof __enkoreUserFunction {\n`

	code += `\tconst context: EnkoreJSRuntimeContext = enkoreCreateContext(ctxOrOptions)\n`

	if (hasDependencies) {
		code += `\tconst dependencies: __EnkoreFunctionDependencies = `

		code += (() => {
			if (!dependencies.length) return `{}`

			let tmp = `{\n`

			for (const [i, dependency] of dependencies.entries()) {
				tmp += `\t\t${dependency.key}: __enkoreDep${i}(context),\n`
			}

			tmp = tmp.slice(0, -2)

			return `${tmp}\n\t}`
		})()

		code += `\n`
	}

	code += `\n`

	code += `\tconst fn: any = ${asyncStr("async ")}function ${exportName}(...args: any[]) {\n`
	code += `\t\t// @ts-ignore:next-line\n`
	code += `\t\treturn ${asyncStr("await ")}${implementation.name}(context, ${hasDependencies ? "dependencies, " : ""}...args);\n`
	code += `\t}\n`

	code += `\n`
	code += `\treturn fn;\n`

	code += `}\n`

	return code

	function functionDeclarationToString(decl: MyTSFunctionDeclaration) {
		let tmp = ``

		tmp += decl.jsDoc
		tmp += (decl.jsDoc.length ? "\n" : "")
		tmp += nodeMyTS.convertMyTSFunctionDeclarationToString({
			...decl,
			parameters: decl.parameters.slice(hasDependencies ? 2 : 1)
		}, {
			overwriteFunctionName: "__enkoreUserFunction"
		}) + "\n"

		return tmp
	}

	function asyncStr(str: string): string {
		if (variant !== "asyncVariant") {
			return ""
		}

		return str
	}
}
