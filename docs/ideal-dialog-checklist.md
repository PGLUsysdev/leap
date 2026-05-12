# Ideal Dialog Checklist

## Overview
This checklist defines the requirements for ideal form dialogs in the application. Use this to ensure consistent, user-friendly dialog implementations.

## DialogContent Styling Requirements

### Height Control
- [ ] **Must use `max-h-[90vh]` class**
  - Allows easy customization: change `90vh` to any value
  - Prevents dialog from exceeding screen height
  - Uses viewport height units for responsive behavior

### Width Control  
- [ ] **Must use `sm:max-w-2xl` class (or appropriate size)**
  - Available sizes:
    - `sm:max-w-sm` - Small dialogs
    - `sm:max-w-md` - Medium dialogs
    - `sm:max-w-lg` - Large dialogs
    - `sm:max-w-xl` - Extra large dialogs
    - `sm:max-w-2xl` - 2x extra large (default)
    - `sm:max-w-3xl` - 3x extra large
    - `sm:max-w-4xl` - 4x extra large
    - `sm:max-w-full` - Full width
    - `sm:max-w-[50%]` - Percentage-based (any percentage)
    - `sm:max-w-[600px]` - Arbitrary values
  - Responsive with breakpoint prefix

### Layout Structure
- [ ] **Must use `flex flex-col` classes**
  - Column-based flexbox layout
  - Enables proper content distribution
  - Essential for scrollable content areas

**Implementation Example:**
```typescript
<DialogContent
    className="flex max-h-[90vh] flex-col sm:max-w-2xl"
>
```

## Loading State Protection Requirements

### Escape Key Blocking
- [ ] **Must prevent escape key during loading**
  - Uses `onEscapeKeyDown={(e) => isLoading && e.preventDefault()}`
  - Only active when `isLoading` is true
  - Prevents accidental dialog closure during operations

### Outside Click Prevention
- [ ] **Must prevent outside clicks during loading**
  - Uses `onPointerDownOutside={(e) => isLoading && e.preventDefault()}`
  - Blocks clicking outside dialog to close it
  - Maintains loading state integrity

**Implementation Example:**
```typescript
<DialogContent
    className="flex max-h-[90vh] flex-col sm:max-w-2xl"
    onEscapeKeyDown={(e) => isLoading && e.preventDefault()}
    onPointerDownOutside={(e) => isLoading && e.preventDefault()}
>
```

## Footer Button Management Requirements

### Cancel Button
- [ ] **Must be disabled during loading**
  - Uses `disabled={isLoading}`
  - Prevents dialog closure during operations
  - Shows disabled visual state

### Submit Button
- [ ] **Must be disabled during loading**
  - Uses `disabled={isLoading}`
  - Prevents duplicate submissions
  - Shows loading state with spinner

### Reset Button (Optional)
- [ ] **If present, should be disabled during loading for consistency**
  - Uses `disabled={isLoading}`
  - Prevents form reset during operations
  - Maintains consistent behavior
  - Note: Not all forms require a reset button

### Loading State Visual Feedback
- [ ] **Submit button must show spinner during loading**
  - Uses `<Spinner />` component
  - Includes contextual text ("Saving Changes", "Adding Item")
  - Uses `flex items-center gap-1` for proper alignment

**Implementation Example:**
```typescript
<DialogFooter>
    <Button 
        variant="outline" 
        onClick={() => handleReset()}
        disabled={isLoading}  // Recommended
    >
        Reset
    </Button>

    <Button
        type="button"
        variant="outline"
        onClick={() => onOpenChange(false)}
        disabled={isLoading}
    >
        Cancel
    </Button>

    <Button
        type="submit"
        form="form-id"
        disabled={isLoading}
    >
        {isLoading ? (
            <span className="flex items-center gap-1">
                <Spinner />
                Processing...
            </span>
        ) : (
            'Submit'
        )}
    </Button>
</DialogFooter>
```

## Dynamic Content Requirements

### Dialog Title
- [ ] **Must change based on edit/create mode**
  - Shows "Edit [Entity]" when editing
  - Shows "Add [Entity]" when creating
  - Uses conditional rendering

### Dialog Description
- [ ] **Must provide context-aware helper text**
  - Different text for edit vs create modes
  - Clear description of current action

### Submit Button Text
- [ ] **Must change based on mode and loading state**
  - "Save Changes" / "Saving Changes" for edit mode
  - "Add Item" / "Adding Item" for create mode
  - Shows spinner during loading

**Implementation Example:**
```typescript
<DialogHeader>
    <DialogTitle>
        {selectedItem ? 'Edit Entity' : 'Add Entity'}
    </DialogTitle>
    <DialogDescription>
        {selectedItem 
            ? 'Editing the entity details' 
            : 'Add a new entity to the list'}
    </DialogDescription>
</DialogHeader>
```

## Complete Dialog Structure Template

```typescript
<Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent
        className="flex max-h-[90vh] flex-col sm:max-w-2xl"
        onEscapeKeyDown={(e) => isLoading && e.preventDefault()}
        onPointerDownOutside={(e) => isLoading && e.preventDefault()}
    >
        <DialogHeader>
            <DialogTitle>
                {selectedItem ? 'Edit Entity' : 'Add Entity'}
            </DialogTitle>
            <DialogDescription>
                {selectedItem 
                    ? 'Editing the entity details' 
                    : 'Add a new entity to the list'}
            </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0">
            <ScrollArea className="w-full">
                {/* Form content goes here */}
            </ScrollArea>
        </div>

        <DialogFooter>
            <Button 
                variant="outline" 
                onClick={() => handleReset()}
                disabled={isLoading}
            >
                Reset
            </Button>

            <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
            >
                Cancel
            </Button>

            <Button
                type="submit"
                form="form-id"
                disabled={isLoading}
            >
                {selectedItem ? (
                    isLoading ? (
                        <span className="flex items-center gap-1">
                            <Spinner />
                            Saving Changes
                        </span>
                    ) : (
                        'Save Changes'
                    )
                ) : isLoading ? (
                    <span className="flex items-center gap-1">
                        <Spinner />
                        Adding Item
                    </span>
                ) : (
                    'Add Item'
                )}
            </Button>
        </DialogFooter>
    </DialogContent>
</Dialog>
```

## Compliance Checklist

For each form dialog implementation, verify the following:

### DialogContent
- [ ] Uses `flex max-h-[90vh] flex-col sm:max-w-[]` classes
- [ ] Has escape key protection during loading
- [ ] Has outside click protection during loading

### DialogHeader
- [ ] Dynamic title based on edit/create mode
- [ ] Context-aware description text

### DialogFooter
- [ ] All buttons disabled during loading
- [ ] Submit button shows loading spinner
- [ ] Dynamic button text based on mode and state

### Overall Structure
- [ ] Proper Dialog wrapper with open/onOpenChange
- [ ] ScrollArea for form content with exact structure:
  ```typescript
  <div className="flex min-h-0">
      <ScrollArea className="w-full">
          {/* Form content goes here */}
      </ScrollArea>
  </div>
  ```
- [ ] Responsive design considerations

## Testing Checklist

### Functionality Tests
- [ ] Dialog opens/closes correctly
- [ ] Form submission works in both modes
- [ ] Loading states activate properly
- [ ] Dialog cannot be closed during loading
- [ ] All buttons are disabled during loading

### Visual Tests
- [ ] Dialog sizing is responsive
- [ ] Loading spinner appears correctly
- [ ] Button states are visually clear
- [ ] Content scrolls properly when needed

### Accessibility Tests
- [ ] Keyboard navigation works
- [ ] Screen reader support
- [ ] Focus management
- [ ] ARIA attributes present

## Form Files to Refactor

The following form dialog files need to be updated to comply with this checklist:

- [x] `resources/js/pages/aip/form-dialog.tsx`
- [x] `resources/js/pages/aip-summary/aip-entry-form-dialog.tsx`
- [x] `resources/js/pages/ppmp/form-dialog.tsx`
- [x] `resources/js/pages/ppa/form-dialog.tsx`
- [x] `resources/js/pages/offices/form-dialog.tsx`
- [x] `resources/js/pages/sector/form-dialog.tsx`
- [x] `resources/js/pages/lgu-level/form-dialog.tsx`
- [x] `resources/js/pages/office-type/form-dialog.tsx`
- [x] `resources/js/pages/price-list/form-dialog.tsx` (✅ Already compliant)
- [x] `resources/js/pages/ppmp-category/form-dialog.tsx`
- [x] `resources/js/pages/chart-of-account/form-dialog.tsx`
- [x] `resources/js/pages/funding-source/form-dialog.tsx`

## Notes

- Always use TypeScript interfaces for props
- Implement proper error handling
- Consider mobile responsiveness
- Maintain consistent styling across dialogs
- Test with various screen sizes
- Verify loading states with slow connections
