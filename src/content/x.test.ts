import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseHTML } from 'linkedom';
import { findPosts, isThreadPage } from './x';

function fixture(body: string): Document {
  return parseHTML(`<!doctype html><html><body>${body}</body></html>`).document;
}

test('plain post gives one part rooted at the article', () => {
  const doc = fixture(`
    <article data-testid="tweet">
      <div data-testid="User-Name"><span>Alice</span></div>
      <div data-testid="tweetText">  Hello
        world   from X </div>
    </article>`);
  const posts = findPosts(doc);
  assert.equal(posts.length, 1);
  assert.equal(posts[0].text, 'Hello world from X');
  assert.equal(posts[0].root, doc.querySelector('article'));
});

test('post with a quote gives separate outer and quote parts', () => {
  const doc = fixture(`
    <article data-testid="tweet">
      <div data-testid="tweetText">Outer take on this</div>
      <div role="link" id="quote">
        <div data-testid="tweetText">Quoted original text</div>
      </div>
    </article>`);
  const posts = findPosts(doc);
  assert.equal(posts.length, 2);
  const [outer, quote] = posts;
  assert.equal(outer.root, doc.querySelector('article'));
  assert.equal(outer.text, 'Outer take on this');
  assert.ok(!outer.text.includes('Quoted'));
  assert.equal(quote.root, doc.getElementById('quote'));
  assert.equal(quote.text, 'Quoted original text');
});

test('article without tweetText gives no parts', () => {
  const doc = fixture('<article data-testid="tweet"><img alt="photo"></article>');
  assert.equal(findPosts(doc).length, 0);
});

test('isThreadPage matches only status paths', () => {
  assert.equal(isThreadPage('/elonmusk/status/123'), true);
  assert.equal(isThreadPage('/home'), false);
  assert.equal(isThreadPage('/search'), false);
  assert.equal(isThreadPage('/elonmusk'), false);
});
