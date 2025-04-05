import type {API} from "#~src/API.mts"
import type {Variant} from "#~src/generateFactoryInstantiationFile/Variant.mts"
import {isAsyncSyncExpandableFilePath,} from "@enkore/target-js-utils"
import {checkOptions} from "#~src/generateFactoryInstantiationFile/checkOptions.mts"
import {expand} from "#~src/generateFactoryInstantiationFile/expand.mts"
import {_generateFactoryFile} from "#~src/generateFactoryInstantiationFile/_generateFactoryFile.mts"

export const generateFactoryFile: API["generateFactoryFile"] = function(
	options,
	// this is to be able to tell if expand() was used
	// users should never set this value
	__internalIsAsyncSyncVariant?: Variant
) {
	checkOptions(options)

	if (isAsyncSyncExpandableFilePath(options.source)) {
		return expand(options, generateFactoryFile)
	}

	return [
		_generateFactoryFile(
			options,
			__internalIsAsyncSyncVariant ?? "noVariant"
		)
	]
}
