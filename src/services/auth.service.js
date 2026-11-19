const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const dataFolder = path.join(__dirname, '../data');
const usersFile = path.join(dataFolder, 'users.json');
const isProduction = process.env.NODE_ENV === 'production';
const adminEmail = (process.env.ADMIN_EMAIL || (isProduction ? '' : 'admin@gmail.com')).trim().toLowerCase();
const adminPassword = process.env.ADMIN_PASSWORD || (isProduction ? '' : '123456');

function checkProductionSettings() {
  if (!isProduction) {
    return;
  }

  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('Production requires a JWT_SECRET with at least 32 characters.');
  }

  if (
    !adminEmail
    || !adminPassword
    || adminPassword.length < 12
    || Buffer.byteLength(adminPassword, 'utf8') > 72
  ) {
    throw new Error('Production requires ADMIN_EMAIL and an ADMIN_PASSWORD with at least 12 characters.');
  }
}

function readUsers() {
  fs.mkdirSync(dataFolder, { recursive: true });

  if (!fs.existsSync(usersFile)) {
    fs.writeFileSync(usersFile, '[]', { encoding: 'utf8', mode: 0o600 });
  }

  const users = JSON.parse(fs.readFileSync(usersFile, 'utf8'));
  if (!Array.isArray(users)) {
    throw new Error('The local users file must contain a JSON array.');
  }

  return users;
}

function saveUsers(users) {
  const temporaryFile = `${usersFile}.${process.pid}.tmp`;
  fs.writeFileSync(temporaryFile, JSON.stringify(users, null, 2), {
    encoding: 'utf8',
    mode: 0o600
  });
  fs.renameSync(temporaryFile, usersFile);
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role
  };
}

async function initializeUsers() {
  checkProductionSettings();

  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail)
    || adminPassword.length < 6
    || Buffer.byteLength(adminPassword, 'utf8') > 72
  ) {
    throw new Error('Set a valid admin email and a password with at least 6 characters.');
  }

  const users = readUsers();
  const existingAdmin = users.find((user) => user.email === adminEmail);

  if (existingAdmin) {
    if (existingAdmin.role !== 'admin') {
      throw new Error('The configured admin email already belongs to a non-admin account.');
    }
    return;
  }

  users.push({
    id: crypto.randomUUID(),
    name: 'Quản trị viên',
    email: adminEmail,
    passwordHash: await bcrypt.hash(adminPassword, 10),
    role: 'admin',
    createdAt: new Date().toISOString()
  });
  saveUsers(users);
}

function findUserByEmail(email) {
  return readUsers().find((user) => user.email === email.trim().toLowerCase());
}

function findUserById(id) {
  return readUsers().find((user) => user.id === id);
}

async function createReader({ name, email, password }) {
  const normalizedEmail = email.trim().toLowerCase();
  const users = readUsers();

  if (users.some((user) => user.email === normalizedEmail)) {
    return null;
  }

  const user = {
    id: crypto.randomUUID(),
    name: name.trim(),
    email: normalizedEmail,
    passwordHash: await bcrypt.hash(password, 10),
    role: 'user',
    createdAt: new Date().toISOString()
  };

  const latestUsers = readUsers();
  if (latestUsers.some((savedUser) => savedUser.email === normalizedEmail)) {
    return null;
  }

  latestUsers.push(user);
  saveUsers(latestUsers);
  return publicUser(user);
}

async function checkPassword(user, password) {
  return bcrypt.compare(password, user.passwordHash);
}

function countUsers() {
  return readUsers().filter((user) => user.role === 'user').length;
}

module.exports = {
  checkPassword,
  countUsers,
  createReader,
  findUserByEmail,
  findUserById,
  initializeUsers,
  publicUser
};
