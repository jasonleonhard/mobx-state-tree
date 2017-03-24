import {onSnapshot, onPatch, onAction, createFactory, applyPatch, applyPatches, applyAction, applyActions, _getNode, getPath, IJsonPatch, applySnapshot, getSnapshot, composeFactory, types} from "../"
import {test} from "ava"

interface ITestSnapshot{
    to: string
}

interface ITest{
    to: string
    setTo: (to: string) => void
}

const createTestFactories = () => {
    const Factory = createFactory({
        to: 'world',
        setTo(to) {
            this.to = to
        }
    })

    const ComputedFactory = createFactory({
        width: 100,
        height: 200,
        get area(){
            return this.width * this.height
        }
    })

    const BoxFactory = createFactory({
        width: 0,
        height: 0
    })

    const ColorFactory = createFactory({
        color: "#FFFFFF"
    })

    return {Factory, ComputedFactory, BoxFactory, ColorFactory}
}

// === FACTORY TESTS ===
test("it should create a factory", (t) => {
    const {Factory} = createTestFactories()

    t.deepEqual(getSnapshot(Factory.create()) as any, {to: 'world'})
    t.deepEqual(Factory.create().toString(), "AnonymousModel{\"to\":\"world\"}")
})

test("it should restore the state from the snapshot", (t) => {
    const {Factory} = createTestFactories()

    t.deepEqual(Factory.create({to: 'universe'}).toJSON(), { to: 'universe' })
})

// === SNAPSHOT TESTS ===
test("it should emit snapshots", (t) => {
    const {Factory} = createTestFactories()
    const doc = Factory.create()

    let snapshots = []
    onSnapshot(doc, snapshot => snapshots.push(snapshot))

    doc.to = 'universe'

    t.deepEqual(snapshots, [{to: 'universe'}])
})

test("it should apply snapshots", (t) => {
    const {Factory} = createTestFactories()
    const doc = Factory.create()

    applySnapshot(doc, {to: 'universe'})

    t.deepEqual(doc.toJSON(), {to: 'universe'})
})

test("it should return a snapshot", (t) => {
    const {Factory} = createTestFactories()
    const doc = Factory.create()

    t.deepEqual(getSnapshot<ITestSnapshot, ITest>(doc), {to: 'world'})
})

// === PATCHES TESTS ===
test("it should emit patches", (t) => {
    const {Factory} = createTestFactories()
    const doc = Factory.create()

    let patches = []
    onPatch(doc, patch => patches.push(patch))

    doc.to = "universe"

    t.deepEqual(patches, [
        {op: "replace", path: "/to", value: "universe"}
    ])
})

test("it should apply a patch", (t) => {
    const {Factory} = createTestFactories()
    const doc = Factory.create()

    applyPatch(doc, {op: "replace", path: "/to", value: "universe"})

    t.deepEqual(doc.toJSON(), {to: 'universe'})
})

test("it should apply patches", (t) => {
    const {Factory} = createTestFactories()
    const doc = Factory.create()

    applyPatches(doc, [{op: "replace", path: "/to", value: "mars"}, {op: "replace", path: "/to", value: "universe"}])

    t.deepEqual(doc.toJSON(), {to: 'universe'})
})

// === ACTIONS TESTS ===
test("it should call actions correctly", (t) => {
    const {Factory} = createTestFactories()
    const doc = Factory.create()

    doc.setTo('universe')

    t.deepEqual(doc.toJSON(), {to: 'universe'})
})

test("it should emit action calls", (t) => {
    const {Factory} = createTestFactories()
    const doc = Factory.create()

    let actions = []
    onAction(doc, action => actions.push(action))

    doc.setTo('universe')

    t.deepEqual(actions, [{name: "setTo", path: "", args: ["universe"]}])
})

test("it should apply action call", (t) => {
    const {Factory} = createTestFactories()
    const doc = Factory.create()

    applyAction(doc, {name: "setTo", path: "", args: ["universe"]})

    t.deepEqual(doc.toJSON(), {to: 'universe'})
})


test("it should apply actions calls", (t) => {
    const {Factory} = createTestFactories()
    const doc = Factory.create()

    applyActions(doc, [{name: "setTo", path: "", args: ["mars"]}, {name: "setTo", path: "", args: ["universe"]}])

    t.deepEqual(doc.toJSON(), {to: 'universe'})
})


// === COMPUTED VALUES ===
test("it should have computed properties", (t) => {
    const {ComputedFactory} = createTestFactories()
    const doc = ComputedFactory.create()

    doc.width = 3
    doc.height = 2

    t.deepEqual(doc.area, 6)
})

test("it should throw if snapshot has computed properties", (t) => {
    const {ComputedFactory} = createTestFactories()

    const error = t.throws(() => {
        const doc = ComputedFactory.create({area: 3})
    })

    t.is(error.message, "[mobx-state-tree] Snapshot {\"area\":3} is not assignable to type AnonymousModel. Expected { width: primitive; height: primitive } instead.")
})

// === COMPOSE FACTORY ===
test("it should compose factories", (t) => {
    const {BoxFactory, ColorFactory} = createTestFactories()
    const ComposedFactory = composeFactory(BoxFactory, ColorFactory)

    t.deepEqual(ComposedFactory.create().toJSON(), {width: 0, height: 0, color: "#FFFFFF"})
})


// === TYPE CHECKS ===
test("it should check the type correctly", (t) => {
    const {Factory} = createTestFactories()

    const doc = Factory.create()

    t.deepEqual(Factory.is(doc), true)
    t.deepEqual(Factory.is([]), false)
    t.deepEqual(Factory.is({}), true)
    t.deepEqual(Factory.is({to: 'mars'}), true)
    t.deepEqual(Factory.is({wrongKey: true}), false)
})
