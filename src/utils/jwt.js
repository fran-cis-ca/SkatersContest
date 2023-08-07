import jwt from "jsonwebtoken";

//const privateKey =
  //"7gnY?1E8vI/KLRrXifxREA-Lr4CHkZ!0I1BIfb8rymbunkqbJN-xj!a04PSYGxhpwcCxmdkL00A4gdV85Xjs4stzPnk5uQzzOMsQQQ9NWnkOPW9qO?XIf2I50Q1w-UyKuOLGNxKSg!6GoC3iV1HhckuLDwLx6q4SNOB!fJhlgEm0Yjf2yE0GiZ8g7rZ0OVnZJdAUKnCryfar7kL?TbOF9yBFQU?oq3ERuYRqTsm?ww/hz7t2uX/hxx4W1M2ZmhYv";

const sign = (data, privateKey2, expiraEn ) => jwt.sign(data, privateKey2, { expiresIn: expiraEn });

const verify = (token) =>
  jwt.verify(token, process.env.SECRET_KEY, (err, decoded) =>
    err ? { code: 401, error: err.message, errores: "Prohibido el acceso" } : decoded
  );


export { sign, verify };


