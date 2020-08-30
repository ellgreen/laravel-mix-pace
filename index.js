const mix = require('laravel-mix')

const argv = require('yargs').argv;
const command = require('node-cmd')
const fs = require('fs')
const path = require('path')

const ExtraWatchWebpackPlugin = require('extra-watch-webpack-plugin')
const BrowserSync = require('browser-sync')
const BrowserSyncPlugin = require('browser-sync-webpack-plugin')

const { SyncHook } = require('tapable')

/**
 * Pace laravel-mix plugin
 * derived from the laravel-mix-jigsaw plugin
 */

let browserSyncInstance;

class Pace {
    register(config = {}) {
        this.port = argv.port || 3000;

        this.bin = this.paceBinary()

        this.config = {
            browserSync : true,
            open: true,
            browserSyncOptions: {},
            watch: {
                files: [
                    'resources/views/**/*.blade.php',
                ],
            },
            ...config,
        }
    }

    webpackPlugins() {
        return [
            this.pacePlugin(),
            this.watchPlugin(),
            this.config.browserSync ? this.browserSyncPlugin() : undefined
        ].filter(plugin => plugin)
    }

    paceBinary() {
        let pathToBinary = path.normalize('./pace')

        if (fs.existsSync(pathToBinary)) {
            return pathToBinary
        }

        console.error('Could not find Pace binary')
        process.exit()
    }

    pacePlugin() {
        let bin = this.bin

        return new class {
            apply(compiler) {
                compiler.hooks.paceDone = new SyncHook([])

                compiler.hooks.done.tap('Pace Webpack Plugin', () => {
                    return command.get(`php ${bin} build`, (error, stdout, stderr) => {
                        console.log(error ? stderr : stdout)

                        if (browserSyncInstance) {
                            browserSyncInstance.reload()
                        }

                        compiler.hooks.paceDone.call()
                    })
                })
            }
        }
    }

    watchPlugin() {
        return new ExtraWatchWebpackPlugin(this.config.watch)
    }

    browserSyncPlugin() {
        return new BrowserSyncPlugin({
            notify: false,
            open: this.config.open,
            port: this.port,
            server: { baseDir: 'public' },
            ...this.config.browserSyncOptions,
        }, {
            reload: false,
            callback: () => browserSyncInstance = BrowserSync.get('bs-webpack-plugin'),
        });
    }
}

mix.extend('pace', new Pace)
