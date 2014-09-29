describe('The tweet service', function() {

  beforeEach(module("util.tweetService"));

  it('abstracts encoding send tweet links', inject(function(tweetService) {

    var base = tweetService.BASE_URL;

    expect(tweetService.tweet({text: "h e"}))
      .to.equal(base + "tweet?text=h%20e");

    expect(tweetService.tweet({text:"h", hashtags: ["a", "b c"]}))
      .to.equal(base + "tweet?text=h&hashtags=a,b%20c");

    expect(tweetService.tweet({text: "h", url: "http://test.com"}))
      .to.equal(base + "tweet?text=h&url=http%3A%2F%2Ftest.com");

    expect(tweetService.tweet({text: "h", hashtags: ["a", "b"], url: "url"}))
      .to.equal(base + "tweet?text=h&hashtags=a,b&url=url");
    
  }));
});
