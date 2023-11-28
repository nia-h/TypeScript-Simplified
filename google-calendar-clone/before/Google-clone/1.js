// import { parse } from "date-fns";
// // import { zhCN } from "date-fns/locale";

// export function formatDate(date, options) {
//   return new Intl.DateTimeFormat("cn", options).format(date);
// }
// console.log(
//   formatDate(parse("18:27", "HH:mm", new Date()), { timeStyle: "short" })
// );

const myArr = ["cat", "dog", "rabbit"];

for (let i = 0; i < myArr.length; i++) {
  if (myArr[i] === "dog") break;
  console.log("myArr[i]==>", myArr[i]);
}
