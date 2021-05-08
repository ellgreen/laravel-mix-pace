// Heavily inspired by https://github.com/tighten/laravel-mix-jigsaw

const mix = require('laravel-mix')
const { exec } = require('child_process')
const { resolve } = require('path')
const glob = require('glob')

const watch = ({ files, dirs, notDirs }) => (compilation, callback) => {
    files.flatMap(pattern => glob.sync(pattern))
        .map(file => compilation.fileDependencies.add(resolve(file)));
    dirs.flatMap(pattern => glob.sync(pattern))
        .filter(dir => !notDirs.includes(dir))
        .map(dir => compilation.contextDependencies.add(resolve(dir)));
    callback()
}

mix.extend('pace', new class {
    config = {
        buildPath: 'build',
        watch: {
            files: [
                'resources/views/**/*.blade.php',
                'resources/views/**/*.md',
            ],
            dirs: ['resources/*/'],
            notDirs: [],
        },
    }

    register(config = {}) {
        Array.isArray(config.watch)
            ? this.config.watch.files.push(...config.watch)
            : this.config.watch = { ...this.config.watch, ...config.watch }

        if (config.buildPath) {
            this.config.buildPath = config.buildPath
        }
    }

    webpackPlugins() {
        const watchConfig = this.config.watch
        const buildPath = this.config.buildPath

        return [new class {
            apply(compiler) {
                compiler.hooks.afterCompile.tapAsync('PaceWatchPlugin', watch(watchConfig))
                compiler.hooks.afterDone.tap('PaceBuildPlugin', () => {
                    exec(`php pace build ${buildPath}`, (error, stdout, stderr) => {
                        error ? console.warn(`Error building Pace site:\n${stderr}`) : console.log(stdout)
                    })
                })
            }
        }]
    }
})
