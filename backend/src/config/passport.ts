import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import bcrypt from 'bcrypt';

import { prisma } from './prisma';

const cookieExtractor = (req: any) => {
  let token = null;
  if (req && req.cookies) token = req.cookies['token'];
  return token;
};

if (!process.env.JWT_SECRET) {
  console.warn('Warning: JWT_SECRET is not set. Ensure dotenv.config() runs before importing passport config.');
}


passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromExtractors([cookieExtractor, ExtractJwt.fromAuthHeaderAsBearerToken()]),
      secretOrKey: process.env.JWT_SECRET!,
    },
    async (payload: any, done: any) => {
      try {
        
        if (!payload || !payload.id || !payload.email) return done(null, false);
        const userFromToken = { id: payload.id, email: payload.email, name: payload.name };
        return done(null, userFromToken as any);
      } catch (err) {
        return done(err as any, false);
      }
    }
  ) as unknown as any
);

passport.use(
  new LocalStrategy({ usernameField: 'email', passwordField: 'password' }, async (email:string, password:string, done:any) => {
    try {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) return done(null, false, { message: 'Incorrect email or password.' });
      const match = await bcrypt.compare(password, user.password);
      if (!match) return done(null, false, { message: 'Incorrect email or password.' });
      return done(null, user);
    } catch (err) {
      console.error('LocalStrategy error:', err);
      return done(err as any);
    }
  }) as unknown as any
);

export default passport;
