import * as express from 'express'
import {Request, Response} from 'express-serve-static-core'
import * as bodyParser from 'body-parser'
import axios, {AxiosRequestConfig} from 'axios'
import * as tunnel from 'tunnel';
import * as cors from 'cors'
import * as qs from 'qs'

class App {
	public express

	constructor () {
		this.express = express()
		this.mountRoutes()
	}

	private mountRoutes (): void {
		const router = express.Router()
		router.post('/request', async (req: Request, res: Response) => {
			if (req.body.domain.indexOf('https://') !== 0) {
				req.body.domain = `https://${req.body.domain}`
			}
			let kintoneURL = `${req.body.domain}/k/v1/${req.body.path}`
			let axiosObj = {
				method: req.body.method,
				url:kintoneURL
			}
			if (req.body.proxy) {
				const tunnelAxios = tunnel.httpsOverHttp({
					proxy: req.body.proxy 
				});
				axiosObj['httpsAgent'] = tunnelAxios
			}
			if (req.body.method === 'GET') {
				if (req.body.params) {
					axiosObj['params'] = req.body.params
					axiosObj['paramsSerializer'] = (params) => {
						return qs.stringify(params, {arrayFormat: 'repeat'})
					}
				}
			}
			else {
				if (req.body.params) {
					axiosObj['params'] = req.body.params
				}
				if (req.body.data) {
					axiosObj['data'] = req.body.data
				}
			}
			if (req.body.headers) {
				axiosObj['headers'] = req.body.headers
			}
			try {
				let response = await axios.request(axiosObj as AxiosRequestConfig)
				res.json(response.data)
			} catch (error) {
				let errorObj = {}
				if (error.response && error.response.data) {
					errorObj = error.response.data
				}
				else {
					console.log(axiosObj)
					errorObj = {
						data: 'api-proxy error'
					}
				}
				res.status(200).json(errorObj)
			}
		})
		this.express.use(bodyParser.urlencoded({ extended: false }));
		this.express.use(bodyParser.json({limit:'4mb'}));
		this.express.use(cors())
		this.express.use('/', router)
	}
}

export default new App().express
