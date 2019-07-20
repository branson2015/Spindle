export default [
    //UMD, CommonJS, and ESModule
	{
		input: 'src/main.js',
		external: [],
		output: [
            { file: 'dist/spindle.umd.js', format: 'umd', name: 'Spindle'}/*,
			{ file: 'dist/spindle.cjs.js', format: 'cjs', name: 'Spindle' },
			{ file: 'dist/spindle.esm.js', format: 'es',  name: 'Spindle' }*/
		]
	}
];
