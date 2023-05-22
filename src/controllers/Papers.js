import request from "request";

export function dspaceProxy(req, res) {
  const url = req.query.url.replace('jspui', 'xmlui');
  const options = {
    url: url,
    auth: {
      user: 'spit',
      password: 'DSpace'
    }
  };
  request(options).pipe(res); 
}