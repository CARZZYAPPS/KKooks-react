import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where
} from 'firebase/firestore'
import { db } from './firebase'

function requireDatabase() {
  if (!db) {
    throw new Error('Firestore is not configured. Add your Firebase values to the .env file.')
  }
}

export async function createUserProfile(user, profile = {}) {
  requireDatabase()
  const userRef = doc(db, 'users', user.uid)
  await setDoc(userRef, {
    uid: user.uid,
    email: user.email,
    name: profile.name || 'New member',
    createdAt: serverTimestamp(),
    ...profile
  }, { merge: true })
  return userRef
}

export async function getUserProfile(userId) {
  requireDatabase()
  const snapshot = await getDoc(doc(db, 'users', userId))
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null
}

export async function createEvent(event, userId) {
  requireDatabase()
  const eventRef = await addDoc(collection(db, 'events'), {
    ...event,
    ownerId: userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  })
  return eventRef.id
}

export async function getEvents() {
  requireDatabase()
  const snapshot = await getDocs(query(collection(db, 'events')))
  return snapshot.docs.map((eventDoc) => ({ id: eventDoc.id, ...eventDoc.data() }))
}

export async function updateEvent(eventId, changes) {
  requireDatabase()
  await updateDoc(doc(db, 'events', eventId), {
    ...changes,
    updatedAt: serverTimestamp()
  })
}

export async function deleteEvent(eventId) {
  requireDatabase()
  await deleteDoc(doc(db, 'events', eventId))
}

export async function saveSiteContent(content, userId) {
  requireDatabase()
  await setDoc(doc(db, 'siteContent', 'main'), {
    ...content,
    updatedBy: userId,
    updatedAt: serverTimestamp()
  })
}

export async function getSiteContent() {
  requireDatabase()
  const snapshot = await getDoc(doc(db, 'siteContent', 'main'))
  return snapshot.exists() ? snapshot.data() : null
}

export async function createRecipe(recipe, userId) {
  requireDatabase()
  const recipeRef = await addDoc(collection(db, 'recipes'), {
    ...recipe,
    status: recipe.status || 'published',
    ownerId: userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  })
  return recipeRef.id
}

export async function getRecipes() {
  requireDatabase()
  const snapshot = await getDocs(query(collection(db, 'recipes'), where('status', '==', 'published')))
  return snapshot.docs.map((recipeDoc) => ({ id: recipeDoc.id, ...recipeDoc.data() }))
}

export async function getPendingRecipes() {
  requireDatabase()
  const snapshot = await getDocs(query(collection(db, 'recipes'), where('status', '==', 'pending')))
  return snapshot.docs.map((recipeDoc) => ({ id: recipeDoc.id, ...recipeDoc.data() }))
}

export async function updateRecipe(recipeId, changes) {
  requireDatabase()
  await updateDoc(doc(db, 'recipes', recipeId), { ...changes, updatedAt: serverTimestamp() })
}

export async function deleteRecipe(recipeId) {
  requireDatabase()
  await deleteDoc(doc(db, 'recipes', recipeId))
}

export async function saveUserFavorites(userId, favorites) {
  requireDatabase()
  await setDoc(doc(db, 'users', userId), { favorites }, { merge: true })
}

export async function subscribeToNewsletter(email) {
  requireDatabase()
  await setDoc(doc(db, 'newsletterSubscribers', email.toLowerCase()), {
    email: email.toLowerCase(),
    subscribedAt: serverTimestamp()
  }, { merge: true })
}

export async function createMenu(menu, userId) {
  requireDatabase()
  const menuRef = await addDoc(collection(db, 'menus'), {
    ...menu,
    ownerId: userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  })
  return menuRef.id
}

export async function deleteMenu(menuId) {
  requireDatabase()
  await deleteDoc(doc(db, 'menus', menuId))
}

export async function getMenus(userId) {
  requireDatabase()
  const snapshot = await getDocs(query(collection(db, 'menus')))
  return snapshot.docs
    .map((menuDoc) => ({ id: menuDoc.id, ...menuDoc.data() }))
    .filter((menu) => menu.ownerId === userId)
}
