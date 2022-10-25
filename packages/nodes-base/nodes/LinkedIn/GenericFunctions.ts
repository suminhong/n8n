import { OptionsWithUrl } from 'request';

import { IExecuteFunctions, IHookFunctions, ILoadOptionsFunctions } from 'n8n-core';
import { NodeApiError } from 'n8n-workflow';

export async function linkedInApiRequest(
	this: IHookFunctions | IExecuteFunctions | ILoadOptionsFunctions,
	method: string,
	endpoint: string,
	// tslint:disable-next-line:no-any
	body: any = {},
	binary?: boolean,
	headers?: object,
	// tslint:disable-next-line:no-any
): Promise<any> {
	const options: OptionsWithUrl = {
		headers: {
			Accept: 'application/json',
			'X-Restli-Protocol-Version': '2.0.0',
		},
		method,
		body,
		url: binary ? endpoint : `https://api.linkedin.com/v2${endpoint}`,
		json: true,
	};

	// If uploading binary data
	if (binary) {
		delete options.json;
		options.encoding = null;
	}

	if (Object.keys(body).length === 0) {
		delete options.body;
	}

	const authentication = this.getNodeParameter('authentication', 0, 'oAuth2') as string;
	try {
		if (authentication === 'oAuth2') {
			return await this.helpers.requestOAuth2!.call(this, 'linkedInOAuth2Api', options, {
				tokenType: 'Bearer',
			});
		} else {
			return await this.helpers.requestWithAuthentication.call(this, 'linkedInApi', options);
		}
	} catch (error) {
		throw new NodeApiError(this.getNode(), error);
	}
}

// tslint:disable-next-line:no-any
export function validateJSON(json: string | undefined): any {
	let result;
	try {
		result = JSON.parse(json!);
	} catch (exception) {
		result = '';
	}
	return result;
}
