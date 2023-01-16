const hexToBinary = (s: string): string => {
  let ret = "";
  const lookupTable: any = {
    "0": "0000",
    "1": "0001",
    "2": "0010",
    "3": "0011",
    "4": "0100",
    "5": "0101",
    "6": "0110",
    "7": "0111",
    "8": "1000",
    "9": "1001",
    a: "1010",
    b: "1011",
    c: "1100",
    d: "1101",
    e: "1110",
    f: "1111",
  };
  for (let i = 0; i < s.length; i += 1) {
    if (lookupTable[s[i]]) {
      ret += lookupTable[s[i]];
    } else {
      throw new Error("Failed to convert hex to binary representation");
    }
  }
  return ret;
};

export { hexToBinary };
