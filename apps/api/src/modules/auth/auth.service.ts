import { prisma } from "../../lib/prisma";
import bcrypt from "bcrypt";
import { CustomError } from "../../errors/custom-error";

interface RegisterInput {
  email: string;
  password: string;
  name: string;
}
export async function registerUser(input: RegisterInput) {
  const email = input.email.trim().toLowerCase();
  const emailAlreadyExist = await prisma.user.findFirst({
    where: { email },
  });
  if (emailAlreadyExist) {
    throw new CustomError("Email Already in use", 409);
  }

  const passwordHash = await bcrypt.hash(input.password, 10);

  const newUser = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name: input.name.trim(),
      roles: {
        create: {
          role: "SELLER",
        },
      },
    },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      roles: true,
    },
  });
  return newUser;
}

interface LoginInput {
  email: string;
  password: string;
}
export async function loginUser(input: LoginInput) {
  const email = input.email.trim();
  const user = await prisma.user.findFirst({
    where: { email },
    select: {
      email: true,
      passwordHash: true,
      id: true,
      name: true,
      roles: true,
    },
  });
  if (!user) {
    throw new CustomError("Invalid Credentials", 401);
  }
  const passwordOk = await bcrypt.compare(input.password, user.passwordHash);
  if (!passwordOk) {
    throw new CustomError("Invalid Credentials", 401);
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    roles: user.roles,
  };
}
