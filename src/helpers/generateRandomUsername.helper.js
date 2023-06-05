module.exports = () => {
  const adjectives = ["Happy", "Silly", "Clever", "Lucky", "Brave"];
  const nouns = ["Cat", "Dog", "Elephant", "Tiger", "Monkey"];
  const randomAdjective =
    adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
  const randomNumber = Math.floor(Math.random() * 1000);

  const username = randomAdjective + randomNoun + randomNumber;
  return username;
};
