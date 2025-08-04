import { getIcon, isValidIconKey, getAvailableIconKeys, ICON_MAP } from '../icon-map'

describe('Icon Map', () => {
  test('getIcon returns correct component for valid key', () => {
    const HomeIcon = getIcon('home')
    expect(HomeIcon).toBeDefined()
    expect(typeof HomeIcon).toBe('function')
  })

  test('getIcon returns null for invalid key', () => {
    const InvalidIcon = getIcon('invalid-key')
    expect(InvalidIcon).toBeNull()
  })

  test('isValidIconKey returns true for valid keys', () => {
    expect(isValidIconKey('home')).toBe(true)
    expect(isValidIconKey('file-text')).toBe(true)
    expect(isValidIconKey('folder-open')).toBe(true)
  })

  test('isValidIconKey returns false for invalid keys', () => {
    expect(isValidIconKey('invalid-key')).toBe(false)
    expect(isValidIconKey('')).toBe(false)
  })

  test('getAvailableIconKeys returns array of keys', () => {
    const keys = getAvailableIconKeys()
    expect(Array.isArray(keys)).toBe(true)
    expect(keys.length).toBeGreaterThan(0)
    expect(keys).toContain('home')
    expect(keys).toContain('file-text')
  })

  test('all icon keys map to valid components', () => {
    const keys = getAvailableIconKeys()
    keys.forEach(key => {
      const IconComponent = getIcon(key)
      expect(IconComponent).toBeDefined()
      expect(typeof IconComponent).toBe('function')
    })
  })

  test('ICON_MAP contains expected icons', () => {
    expect(ICON_MAP.home).toBeDefined()
    expect(ICON_MAP['file-text']).toBeDefined()
    expect(ICON_MAP['folder-open']).toBeDefined()
    expect(ICON_MAP['chevron-right']).toBeDefined()
  })
})