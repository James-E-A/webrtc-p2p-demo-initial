import { defineConfig } from 'vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import { viteSingleFile } from 'vite-plugin-singlefile'

export default defineConfig({
	esbuild: {
		supported: {
			'top-level-await': true
		}
	},
	plugins: [
		nodePolyfills({
			include: ['events']
		}),
		viteSingleFile()
	]
})
