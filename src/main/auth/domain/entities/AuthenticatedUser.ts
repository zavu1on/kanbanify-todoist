export class AuthenticatedUser {
  constructor(
    readonly id: string,
    readonly fullName: string,
    readonly email: string,
  ) {}
}
