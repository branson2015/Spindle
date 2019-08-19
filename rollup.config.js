import compiler from '@ampproject/rollup-plugin-closure-compiler';
export default {
		input: 'src/main.js',
		external: [],
		output: [ //UMD, CommonJS, and ESModule
            { file: 'dist/spindle.umd.js', format: 'umd', name: 'Spindle'}/*,
			{ file: 'dist/spindle.cjs.js', format: 'cjs', name: 'Spindle' },
			{ file: 'dist/spindle.esm.js', format: 'es',  name: 'Spindle' }*/
		],
		plugins: [
			compiler({
				compilation_level: 'SIMPLE'
			})
		],
	};
