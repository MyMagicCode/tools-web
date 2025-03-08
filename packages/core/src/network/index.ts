import ky from "ky";
import type { Input, KyInstance, Options } from "ky";
import { BasicFetchResult } from "./interface";

export class aplusNetwork {
  private instance: KyInstance;
  token: string | null = null;
  constructor() {
    this.instance = ky.create({
      prefixUrl: "TODO",
      hooks: {
        beforeRequest: [
          async (request) => {
            if (!request.url.endsWith("authorize/login/password")) {
              console.log("非登陆", request.url);
              const token = await this.getToken();
              console.log("token", token);
              request.headers.set("authorization", token);
            }
          },
        ],
      },
    });
  }
  async initToken() {
    const result = await this.instance
      .post<BasicFetchResult>("authorize/login/password", {
        json: {}, // TODO
      })
      .json();

    this.token = result.body?.token;
  }
  async getToken(): Promise<string> {
    if (!this.token) {
      await this.initToken();
      return this.token!;
    }
    return this.token;
  }
  post<T = any>(url: Input, options?: Options) {
    return this.instance.post<BasicFetchResult<T>>(url, options).json();
  }
}
