module.exports = function(grunt) {
    grunt.initConfig({
    	pkg: grunt.file.readJSON('package.json'),
        watch: {
            files: ['main.js'],
            tasks: ['uglify', 'file_append'],
        },
        uglify: {
        	js: {
        		files: {
        			'dist.js': ['main.js']
        		}
        	}
        },
        file_append: {
        	default_options: {
        		files: [
        		{
        			prepend: 'javascript:',
        			input: 'dist.js',
        			output: 'bookmarklet.js'
        		}]
        	}
        }
    });
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-file-append');
}