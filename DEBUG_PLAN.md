# React Error #185 Debugging Plan

## Issue Summary
- **Symptom 1**: Main menu screen flashes and disappears on load
- **Symptom 2**: React Error #185 (Maximum update depth exceeded)
- **Error Message**: "Maximum update depth exceeded. This can happen when a component repeatedly calls setState inside componentWillUpdate or componentDidUpdate. React limits the number of nested updates to prevent infinite loops."

## Root Causes Identified (Ordered by Likelihood)

### 🔴 **CRITICAL: Zustand Selector Anti-Pattern** (FIXED)
**Location**: `src/App.tsx` line 13-17, `src/components/screens/CharacterSummaryScreen.tsx` line 11-17

**Problem**: Creating new objects in Zustand selectors causes infinite re-renders
```typescript
// ❌ BAD - Creates new object on every render
const { screen, modal, closeModal } = useUIStore((s) => ({
  screen: s.screen,
  modal: s.modal,
  closeModal: s.closeModal,
}))
```

**Fix Applied**: Split into separate selectors
```typescript
// ✅ GOOD - Stable references
const screen = useUIStore((s) => s.screen)
const modal = useUIStore((s) => s.modal)
const closeModal = useUIStore((s) => s.closeModal)
```

### 🟡 **Potential Issue: Modal Object Reference**
**Location**: `src/stores/uiStore.ts` line 31-32, 42-43

**Problem**: Modal object is recreated on every openModal/closeModal call
```typescript
openModal: (c) => set({ modal: { open: true, content: c } }),
closeModal: () => set({ modal: { open: false } }),
```

**Concern**: If `modal` is subscribed to, it will trigger re-renders even if only `open` state changes.

### 🟢 **Other Potential Causes** (Less Likely)
1. **Async race conditions** during seeding in `main.tsx`
2. **useMemo dependencies** becoming unstable
3. **Component mounting/unmounting** during screen transitions

## Debug Instrumentation Added

### 1. Render Counting
All screen components now track their render count:
- `App.tsx`
- `MainMenuScreen.tsx`
- `CharacterSummaryScreen.tsx`
- `GameLoopScreen.tsx`
- `LifepathScreen.tsx`

**Alert**: If any component renders >50 times, it logs an error to console.

### 2. Store Action Logging
All state-changing actions now log to console:
- `uiStore.setScreen()`
- `uiStore.openModal()`
- `uiStore.closeModal()`
- `uiStore.setPendingLifepath()`
- `gameStore.setCharacter()`

### 3. Initialization Logging
`main.tsx` now logs:
- App initialization start
- Seeding start/complete
- React render start/complete

## Testing Instructions

### Test 1: Fresh Load
1. Clear browser cache and IndexedDB
2. Hard refresh the page (Ctrl+Shift+R)
3. Open DevTools Console
4. Look for:
   - `[DEBUG main]` messages showing initialization flow
   - `[DEBUG App]` showing render count
   - `[DEBUG MainMenuScreen]` showing render count
   - Any "INFINITE LOOP DETECTED" errors

**Expected Result**: Should see ~1-3 renders per component during initial load

### Test 2: Navigation Flow
1. Start from Main Menu
2. Click "NEW ADVENTURE"
3. Complete lifepath
4. Navigate to Character Summary
5. Watch console for:
   - Screen transitions logged by `[DEBUG uiStore]`
   - Render counts for each screen
   - Any unexpected multiple renders

**Expected Result**: Each screen should render 1-2 times on navigation

### Test 3: Reproduce Original Error
1. Navigate through app normally
2. Watch for the flash/disappear behavior
3. When error occurs, check console for:
   - Which component is rendering excessively
   - What state changes are triggering renders
   - Stack trace of the error

## What to Look For in Console

### 🔴 Red Flags (Indicates Problem)
- Any component with render count >10
- "INFINITE LOOP DETECTED" messages
- Rapid repeated state changes (same action logged multiple times quickly)
- Screen switching back and forth rapidly

### 🟢 Normal Behavior
- Render counts 1-3 for most components
- Single state changes per user action
- Smooth screen transitions with single setScreen calls

## Next Steps

### If Issue Persists
Check the console output and identify:
1. **Which component** is rendering excessively?
2. **Which state change** is triggering it? (look at store logs)
3. **What pattern** do you see? (happens on load, navigation, or random?)

### Possible Additional Fixes
If the Zustand selector fix doesn't solve it:

1. **Modal optimization**: Use `shallow` comparison from zustand
   ```typescript
   import { shallow } from 'zustand/shallow'
   const modal = useUIStore((s) => s.modal, shallow)
   ```

2. **useMemo stabilization**: Add more granular dependencies

3. **Async handling**: Add loading states to prevent race conditions

## Cleanup

Once the issue is resolved, we can remove debug logging:
- Search for `[DEBUG` comments in code
- Remove console.log statements
- Remove renderCount tracking
- Remove useEffect blocks that only log

## Files Modified
- ✅ `src/App.tsx` - Fixed selector, added logging
- ✅ `src/components/screens/MainMenuScreen.tsx` - Added logging
- ✅ `src/components/screens/CharacterSummaryScreen.tsx` - Fixed selector, added logging
- ✅ `src/components/screens/GameLoopScreen.tsx` - Added logging
- ✅ `src/components/screens/LifepathScreen.tsx` - Added logging
- ✅ `src/stores/uiStore.ts` - Added action logging
- ✅ `src/stores/gameStore.ts` - Added action logging
- ✅ `src/main.tsx` - Added initialization logging
