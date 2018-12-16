export default [
    //UMD, CommonJS, and ESModule
	{
		input: 'src/main.js',
		external: [],
		output: [
            { file: spindle.umd.js, format: 'umd'},
			{ file: spindle.cjs.js, format: 'cjs' },
			{ file: spindle.esm.js, format: 'es' }
		]
	}
];
