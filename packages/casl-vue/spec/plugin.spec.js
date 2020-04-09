import { createLocalVue } from '@vue/test-utils'
import { defineAbility } from '@casl/ability'
import { abilitiesPlugin } from '../src'

describe('Abilities plugin', () => {
  let ability
  let Component
  let Vue
  let vm

  beforeEach(() => {
    Vue = createLocalVue()
    Component = Vue.extend({
      props: {
        post: { default: () => new Post() }
      },
      render(h) {
        return h('div', this.$can('read', this.post) ? 'Yes' : 'No')
      }
    })
  })

  describe('when ability is provided', () => {
    beforeEach(() => {
      ability = defineAbility(can => can('read', 'Post'))
      Vue.use(abilitiesPlugin, ability)
      vm = new Component()
    })

    it('defines `$can` for each component', () => {
      expect(vm.$can).to.be.a('function')
    })

    it('defines `$ability` instance for all components', () => {
      expect(vm.$ability).to.equal(ability)
    })
  })

  describe('when ability is provided as option of a component', () => {
    beforeEach(() => {
      ability = defineAbility(can => can('read', 'Post'))
      Vue.use(abilitiesPlugin)
    })

    it('uses that ability', () => {
      vm = new Component({ ability })
      spy.on(ability, 'can')
      vm.$can('read', 'Post')

      expect(vm.$ability).to.equal(ability)
      expect(ability.can).to.have.been.called.with.exactly('read', 'Post')
    })

    it('passes ability down through the components tree', () => {
      vm = new Vue({
        ability,
        render: h => h(Component)
      }).$mount()

      expect(vm.$children[0].$ability).to.equal(ability)
    })
  })

  describe('when ability is not provided', () => {
    beforeEach(() => {
      Vue.use(abilitiesPlugin)
      vm = new Component()
    })

    it('throws exception', () => {
      expect(() => vm.$ability).to.throw(Error)
    })
  })

  describe('`$can`', () => {
    beforeEach(() => {
      ability = defineAbility(can => can('read', 'Post'))
      Vue.use(abilitiesPlugin, ability)
      vm = new Component().$mount()
    })

    it('calls `can` method of underlying ability instance', () => {
      spy.on(ability, 'can')
      vm.$can('read', vm.post)

      expect(ability.can).to.have.been.called.with.exactly('read', vm.post)

      spy.restore(ability, 'can')
    })

    it('can be used inside component template', () => {
      expect(vm.$el.textContent).to.equal('Yes')
    })

    it('updates components when ability is updated', (done) => {
      ability.update([])

      vm.$nextTick(() => {
        expect(vm.$el.textContent).to.equal('No')
        done()
      })
    })
  })

  class Post {
    constructor(attrs) {
      Object.assign(this, attrs)
    }
  }
})
