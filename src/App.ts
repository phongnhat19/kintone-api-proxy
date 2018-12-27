import * as express from 'express'
import {Request, Response} from 'express-serve-static-core'
import * as bodyParser from 'body-parser'
import axios, {AxiosRequestConfig} from 'axios'
import * as tunnel from 'tunnel';
import * as cors from 'cors'

class App {
	public express

	constructor () {
		this.express = express()
		this.mountRoutes()
	}

	private mountRoutes (): void {
		const router = express.Router()
		router.post('/request', async (req: Request, res: Response) => {
			let kintoneURL = `https://${req.body.domain}/k/v1/${req.body.path}`
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
				}
			}
			else if (req.body.method === 'POST') {
				if (req.body.data) {
					axiosObj['data'] = req.body.data
				}
			}
			try {
				let response = await axios.request(axiosObj as AxiosRequestConfig)
				res.json(response.data)
			} catch (error) {
				res.status(200).json({
					data: 'error'
				})
			}
		})
		this.express.use(bodyParser.urlencoded({ extended: false }));
		this.express.use(bodyParser.json({limit:'4mb'}));
		this.express.use(cors())
		this.express.use('/', router)
	}
}

export default new App().express
