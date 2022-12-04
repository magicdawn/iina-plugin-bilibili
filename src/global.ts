import './dts/console'

iina.menu.addItem(
  iina.menu.item('DemoPlugin', () => {
    iina.console.log('hello world')
    console.log('hello %s', 'world')

    iina.standaloneWindow.simpleMode()
    iina.standaloneWindow.setContent('<h1>DemoPlugin<h1>')
    iina.standaloneWindow.open()
  })
)
