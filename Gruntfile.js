module.exports = function(grunt) {
    grunt.registerTask('scorm-folders', 'Create scorm folders', function() {
        //grunt.file.write('file.txt', '');

        if(!grunt.file.isDir('scorm') ){
            grunt.file.mkdir('scorm');
        }

        var join = require("path").join;
        if(!grunt.file.isDir(join('scorm', 'packages')) ) {
            grunt.file.mkdir(join('scorm', 'packages'));
        }

        if(!grunt.file.isDir(join('scorm', 'tmp')) ) {
            grunt.file.mkdir(join('scorm', 'tmp'));
        }
    });

    grunt.registerTask('default', ['scorm-folders']);
};