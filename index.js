addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
})

async function handleRequest(request) {
  //request URLs from the API
  var src = 'https://cfw-takehome.developers.workers.dev/api/variants';
  const urls_json = await fetch(src)
    .then(res => res.json());
  var urls = urls_json["variants"];

  //Fetch results in A/B testing style
  const NAME = 'response';
  let response_A = await fetch(urls[0]);
  response_A = rewriter.transform(response_A);
  response_A = new Response(response_A.body, response_A);
  let response_B = await fetch(urls[1]);
  response_B = rewriter.transform(response_B);
  response_B = new Response(response_B.body, response_B);

  //check for cookies
  const cookie = request.headers.get('cookie');
  if (cookie && cookie.includes(`${NAME}=${urls[0]}`)) {
    return response_A;
  } else if (cookie && cookie.includes(`${NAME}=${urls[1]}`)) {
    return response_B;
  } else {
    // if no cookie then this is a new client, decide a group and set the cookie
    let group = Math.random() < 0.5 ? urls[0] : urls[1]; // 50/50 split
    let response = group === urls[0] ? response_A : response_B;
    response.headers.append('Set-Cookie', `${NAME}=${group}; path=/`)
    return response;
  }
}

//URLs for replacement
const OLD_URL = 'cloudflare.com';
const NEW_URL = 'github.com/cloudflare-internship-2020/internship-application-fullstack';

//element handler
class ElementHandler {
  constructor(value, id = 'no id') {
    this.value = value;
    this.id = id;
  }

  element(element) {
    const idName = element.getAttribute('id');
    if (idName == this.id) {
      element.prepend(this.value);
    } else if (this.id == 'no id') {
      element.prepend(this.value);
    }
    if (this.id == 'url') {
      element.setInnerContent(this.value);
      const attribute = element.getAttribute('href');
      element.setAttribute(
        'href',
        attribute.replace(OLD_URL, NEW_URL)
      );
    }
  }
}

const rewriter = new HTMLRewriter()
  .on('title', new ElementHandler('Darong\'s '))
  .on('h1', new ElementHandler('Page', 'title'))
  .on('p', new ElementHandler('Welcome!', 'description'))
  .on('a', new ElementHandler('How I got here', 'url'));
