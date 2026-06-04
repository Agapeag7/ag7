# 🎯 GUIDE INTERACTIF - APPLIQUER LES CORRECTIONS

**Durée estimée**: 5 minutes  
**Difficulté**: ⭐ Facile

---

## 📌 RÉSUMÉ DU PROBLÈME

**2 fichiers**, **1 fonction dupliquée** = **190 lignes de code inutile**

✅ **Solution**: Supprimer `displayUserProfile()` de `actus-complete.js` et corriger les appels

---

## 🔧 CORRECTION MANUELLE EN VS CODE

### ÉTAPE 1: Ouvrir le fichier

1. Ouvrir **VS Code**
2. Ctrl+P → Taper `actus-complete.js`
3. Appuyer sur **Enter**

---

### ÉTAPE 2: Corriger les event listeners (Lignes 866-896)

**Ctrl+G → 866** (aller à la ligne)

**AVANT**:
```javascript
    const openUserProfile = async (post) => {
      if (!post || !post.user_id) return;
      await displayUserProfile(post.user_id);
    };
    
    postAvatars.forEach(avatar => {
      ...
        openUserProfile(post);  // ❌ Passe l'objet
      ...
    });
    
    postAuthors.forEach(author => {
      ...
        openUserProfile(post);  // ❌ Passe l'objet
      ...
    });
```

**APRÈS**:
```javascript
    postAvatars.forEach(avatar => {
      avatar.style.cursor = 'pointer';
      avatar.addEventListener('click', (e) => {
        e.stopPropagation();
        const postCard = avatar.closest('.post-card');
        const postId = parseInt(postCard.dataset.id);
        const post = actusState.posts.find(p => p.id === postId);
        if (post && post.user_id && typeof openUserProfile === 'function') {
          openUserProfile(post.user_id);  // ✓ Passe l'ID
        }
      });
    });
    
    postAuthors.forEach(author => {
      author.style.cursor = 'pointer';
      author.addEventListener('click', (e) => {
        e.stopPropagation();
        const postCard = author.closest('.post-card');
        const postId = parseInt(postCard.dataset.id);
        const post = actusState.posts.find(p => p.id === postId);
        if (post && post.user_id && typeof openUserProfile === 'function') {
          openUserProfile(post.user_id);  // ✓ Passe l'ID
        }
      });
    });
```

**Comment**:
1. Sélectionner les lignes 870-896
2. Supprimer la fonction locale `openUserProfile`
3. Modifier les appels `openUserProfile(post)` → `openUserProfile(post.user_id)`

---

### ÉTAPE 3: Supprimer la fonction dupliquée

**Ctrl+G → 1619** (aller à la ligne de `displayUserProfile`)

**À SUPPRIMER**: Toute la fonction de la ligne ~1619 à ~1800

```javascript
// ===== AFFICHER PROFIL UTILISATEUR =====
async function displayUserProfile(userId) {
    try {
        ...
        [190 lignes de code]
        ...
    }
}
```

**À REMPLACER PAR**:
```javascript
// NOTE: displayUserProfile() a été supprimée - utiliser openUserProfile() de scripts.js
```

**Comment**:
1. Ctrl+G → 1619
2. Sélectionner depuis `// ===== AFFICHER PROFIL` jusqu'à la ligne `}`
3. Supprimer le tout
4. Ajouter le commentaire de remplacement

---

## ✅ VÉRIFICATION

### Checklist:
- [ ] La fonction locale `openUserProfile` est supprimée (ligne ~870)
- [ ] Les appels utilisent `openUserProfile(post.user_id)` (pas `post`)
- [ ] La fonction `displayUserProfile` est supprimée
- [ ] Fichier sauvegardé
- [ ] Pas d'erreur en console (F12)

### Test:
```
1. Rafraîchir la page (F5)
2. Aller à "Actus"
3. Cliquer sur le nom/avatar d'un post
4. Le profil doit s'afficher
5. ✓ Pas d'erreur "displayUserProfile is not defined"
```

---

## 📊 AVANT/APRÈS

| Métrique | Avant | Après |
|----------|-------|-------|
| Fonctions `openUserProfile` | 2 | 1 |
| Code dupliqué | 190 lignes | 0 |
| Bugs potentiels | 3 | 0 |
| Temps de maintenance | 2x | 1x |

---

## 🚀 AIDE VS CODE

### Raccourcis utiles:
- `Ctrl+G` → Aller à la ligne
- `Ctrl+Shift+K` → Supprimer la ligne
- `Ctrl+F` → Chercher
- `Ctrl+H` → Remplacer
- `Alt+Shift+Down` → Dupliquer la ligne

### Utiliser Find & Replace:
```
Chercher: displayUserProfile
Remplacer par: (vide)
Remplacer tout
```

---

## 💡 ASTUCES

### Si vous êtes perdu:
1. `Ctrl+Z` pour annuler
2. `Ctrl+Y` pour refaire
3. Recharger le fichier depuis git

### Vérifier les changements:
```
Ctrl+Shift+G → Afficher Source Control
Voir les fichiers modifiés en bleu
```

---

## 📞 SUPPORT RAPIDE

**Error**: "displayUserProfile is not defined"
- ✓ Vérifier que la fonction est supprimée
- ✓ Recharger la page (Ctrl+Shift+R)

**Error**: "post is not a number"
- ✓ Vérifier que vous passez `post.user_id` et pas `post`

**Error**: "openUserProfile is not defined"
- ✓ Vérifier que `scripts.js` charge avant `actus-complete.js` ✓ (Voir index.php, c'est bon)

