export default [
    //UMD, CommonJS, and ESModule
	{
		input: 'src/main.js',
		external: [],
		output: [
            { dir: 'dist', file: 'spindle.umd.js', format: 'umd', name: 'Spindle'},
			{ dir: 'dist', file: 'spindle.cjs.js', format: 'cjs' },
			{ dir: 'dist', file: 'spindle.esm.js', format: 'es' }
		]
	}
];
