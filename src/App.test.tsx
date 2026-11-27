import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, test, vi } from 'vitest'
import App from './App'
import { USERNAME_KEY } from './screens/Login'
import { fakeApi } from './test/fakeApi'

afterEach(() => {
  vi.useRealTimers()
})

const type = (label: string | RegExp, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } })

describe('logging in', () => {
  test('logged-out visitors see the login screen and nobody’s names', async () => {
    render(<App api={fakeApi().api} />)
    expect(await screen.findByRole('heading', { name: 'Welcome home' })).toBeInTheDocument()
    expect(screen.queryByText(/Radek|Didem/)).not.toBeInTheDocument()
  })

  test('a wrong password shakes the nest and says so kindly', async () => {
    const { api } = fakeApi()
    render(<App api={api} />)
    await screen.findByRole('heading', { name: 'Welcome home' })
    type('Username', 'radek')
    type('Password', 'nope')
    fireEvent.click(screen.getByRole('button', { name: 'Come in' }))
    expect(await screen.findByRole('alert')).toHaveTextContent("didn't match")
    expect(screen.getByLabelText('Password')).toHaveValue('')
  })

  test('first login on a phone asks for its name, then opens Home', async () => {
    const { api } = fakeApi({ deviceName: null })
    render(<App api={api} />)
    await screen.findByRole('heading', { name: 'Welcome home' })
    type('Username', ' Radek ')
    type('Password', 'correct horse')
    fireEvent.click(screen.getByRole('button', { name: 'Come in' }))

    expect(await screen.findByRole('heading', { name: 'Hi Radek!' })).toBeInTheDocument()
    expect(window.localStorage.getItem(USERNAME_KEY)).toBe('radek')
    type("This phone's name", 'Kitchen phone')
    fireEvent.click(screen.getByRole('button', { name: 'Looks good' }))

    expect(await screen.findByText(/Radek$/)).toBeInTheDocument()
    expect(api.nameDevice).toHaveBeenCalledWith(expect.objectContaining({ id: 'u-radek' }), 'session-1', 'Kitchen phone', true)
  })

  test('the phone remembers the last username', async () => {
    window.localStorage.setItem(USERNAME_KEY, 'didem')
    render(<App api={fakeApi().api} />)
    expect(await screen.findByLabelText('Username')).toHaveValue('didem')
  })

  test('a loading problem offers to try again', async () => {
    render(<App api={fakeApi({ loggedIn: true, loadFails: true }).api} />)
    expect(await screen.findByRole('heading', { name: 'Something went wrong' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument()
  })
})

describe('home', () => {
  test('with nothing switched on, the nest is ready and waiting', async () => {
    render(<App api={fakeApi({ loggedIn: true }).api} />)
    expect(await screen.findByText('Your nest is ready')).toBeInTheDocument()
    expect(screen.getByText(/Soon you'll switch on/)).toBeInTheDocument()
  })

  test('members are told who switches things on', async () => {
    const { DIDEM } = await import('./test/fakeApi')
    render(<App api={fakeApi({ loggedIn: true, me: { ...DIDEM } }).api} />)
    expect(await screen.findByText('Radek will switch on the first lists soon.')).toBeInTheDocument()
  })

  test('shows a card for each module that is switched on', async () => {
    render(<App api={fakeApi({ loggedIn: true, enabled: ['groceries', 'finances'] }).api} />)
    expect(await screen.findByRole('button', { name: 'Groceries' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Money' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'To-dos' })).not.toBeInTheDocument()
  })

  test('press and hold a card to pin it to the bar', async () => {
    const { api } = fakeApi({ loggedIn: true, enabled: ['groceries'] })
    render(<App api={api} />)
    const card = await screen.findByRole('button', { name: 'Groceries' })
    const bar = screen.getByRole('navigation', { name: 'Main' })
    expect(within(bar).getAllByRole('button', { name: 'Empty pin spot' })).toHaveLength(2)

    vi.useFakeTimers()
    fireEvent.pointerDown(card, { clientX: 10, clientY: 10 })
    act(() => {
      vi.advanceTimersByTime(600)
    })
    fireEvent.pointerUp(card)
    fireEvent.click(card) // the click after a long press must not open the module
    vi.useRealTimers()

    expect(api.updateMe).toHaveBeenCalledWith('u-radek', { pinned_modules: ['groceries'] })
    expect(within(bar).getByRole('button', { name: 'Groceries' })).toBeInTheDocument()
    expect(await screen.findByRole('status')).toHaveTextContent('Pinned Groceries to the bar')
    expect(window.location.hash).toBe('')
  })

  test('a tap opens the module', async () => {
    render(<App api={fakeApi({ loggedIn: true, enabled: ['groceries'] }).api} />)
    fireEvent.click(await screen.findByRole('button', { name: 'Groceries' }))
    expect(await screen.findByText(/still hatching/)).toBeInTheDocument()
  })
})

describe('the bottom bar', () => {
  test('always has five spots', async () => {
    render(<App api={fakeApi({ loggedIn: true }).api} />)
    const bar = await screen.findByRole('navigation', { name: 'Main' })
    expect(within(bar).getAllByRole('button').map((b) => b.getAttribute('aria-label'))).toEqual([
      'Home',
      'Empty pin spot',
      'Empty pin spot',
      'Everything',
      'Us',
    ])
  })

  test('All lists the modules with pin buttons', async () => {
    const { api } = fakeApi({ loggedIn: true, enabled: ['groceries', 'todos'] })
    render(<App api={api} />)
    fireEvent.click(await screen.findByRole('button', { name: 'Everything' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Pin To-dos' }))
    expect(api.updateMe).toHaveBeenCalledWith('u-radek', { pinned_modules: ['todos'] })
    expect(await screen.findByRole('button', { name: 'Unpin To-dos' })).toHaveAttribute('aria-pressed', 'true')
  })
})

describe('us', () => {
  const openUs = async (api: ReturnType<typeof fakeApi>['api']) => {
    render(<App api={api} />)
    fireEvent.click(await screen.findByRole('button', { name: 'Us' }))
    await screen.findByRole('radiogroup', { name: 'Your bird' })
  }

  test('pick a bird', async () => {
    const { api } = fakeApi({ loggedIn: true })
    await openUs(api)
    fireEvent.click(screen.getByRole('radio', { name: 'Owl' }))
    expect(api.updateMe).toHaveBeenCalledWith('u-radek', { avatar: 'owl' })
    expect(screen.getByRole('radio', { name: 'Owl' })).toHaveAttribute('aria-checked', 'true')
  })

  test('rename yourself', async () => {
    const { api } = fakeApi({ loggedIn: true })
    await openUs(api)
    type('Your name', 'Radek H')
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(api.updateMe).toHaveBeenCalledWith('u-radek', { display_name: 'Radek H' })
    expect(await screen.findByRole('heading', { name: 'Radek H' })).toBeInTheDocument()
  })

  test('a new password needs eight characters and a match', async () => {
    const { api } = fakeApi({ loggedIn: true })
    await openUs(api)
    fireEvent.click(screen.getByRole('button', { name: 'Change my password' }))
    type('New password', 'short')
    expect(screen.getByRole('alert')).toHaveTextContent('At least 8 characters')
    type('New password', 'long enough')
    type('Type it again', 'long enough')
    fireEvent.click(screen.getByRole('button', { name: 'Save password' }))
    expect(api.changePassword).toHaveBeenCalledWith('long enough')
    expect(await screen.findByText(/Password changed/)).toBeInTheDocument()
  })

  test('log out of this phone', async () => {
    const { api } = fakeApi({ loggedIn: true })
    await openUs(api)
    fireEvent.click(screen.getByRole('button', { name: 'Log out of this phone' }))
    expect(await screen.findByRole('heading', { name: 'Welcome home' })).toBeInTheDocument()
  })
})
