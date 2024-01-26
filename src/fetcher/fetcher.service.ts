import { Injectable } from '@nestjs/common';
import axios from 'axios';
import {DebugLogger} from "../decorators/debug-logging.decorator";
import {IPFS_GATEWAYS} from "../globals";
import {formatUrl} from "../utils/format-url";
import {sleep} from "../utils/sleep";


@Injectable()
export class FetcherService {
  @DebugLogger()
  async fetch<T>(
    url: string,
    urlParams: { [key: string]: any } = {},
    retries = 0,
    retryDelay = 0,
  ): Promise<T> {
    try {
      const nbrOfGateways = IPFS_GATEWAYS.length;
      const res = await axios.get<T>(formatUrl(url, IPFS_GATEWAYS[retries % nbrOfGateways]), {
        params: urlParams,
      });
      return res.data;
    } catch (error) {
      if (retries <= 0)
        throw new Error(
          `Error while fetching ${url} with parameters ${JSON.stringify(urlParams)}: ${
            error.message
          }`,
        );
      else {
        await sleep(retryDelay);
        return await this.fetch<T>(url, urlParams, retries - 1, retryDelay);
      }
    }
  }
}
