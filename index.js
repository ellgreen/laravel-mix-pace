const mix = require('laravel-mix')

const argv = require('yargs').argv
const command = require('node-cmd')
const fs = require('fs')
const path = require('path')

const ExtraWatchWebpackPlugin = require('extra-watch-webpack-plugin')
const BrowserSync = require('browser-sync')
const BrowserSyncPlugin = require('browser-sync-webpack-plugin')

/**
 * Pace laravel-mix plugin
 * derived from the laravel-mix-jigsaw plugin
 */

let browserSyncInstance

class Pace {
    register(config = {}) {
        this.port = 3000

        this.bin = this.paceBinary()

        this.config = {
            buildPath: 'build',
            browserSync : true,
            open: true,
            browserSyncOptions: {},
            watch: {
                files: [
                    'resources/views/**/*.blade.php',
                    'resources/views/**/*.md',
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
        let buildPath = this.config.buildPath

        return new class {
            apply(compiler) {
                compiler.afterCompile.tap('PaceWebpackPlugin', () => {
                    console.log('testing')
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
            server: { baseDir: 'build' },
            ...this.config.browserSyncOptions,
        }, {
            reload: false,
            callback: () => browserSyncInstance = BrowserSync.get('bs-webpack-plugin'),
        });
    }
}

mix.extend('pace', new Pace())
