import { Node, mergeAttributes } from '@tiptap/core'

// Custom Video extension for Tiptap
export const Video = Node.create({
    name: 'video',
    group: 'block',
    atom: true,

    addAttributes() {
        return {
            src: {
                default: null,
            },
            controls: {
                default: true,
            },
            style: {
                default: null,
            },
            class: {
                default: null,
            },
        }
    },

    parseHTML() {
        return [
            {
                tag: 'video',
            },
        ]
    },

    renderHTML({ HTMLAttributes }) {
        return ['video', mergeAttributes(HTMLAttributes, { controls: true })]
    },
})

// Custom Audio extension for Tiptap
export const Audio = Node.create({
    name: 'audio',
    group: 'block',
    atom: true,

    addAttributes() {
        return {
            src: {
                default: null,
            },
            controls: {
                default: true,
            },
            style: {
                default: null,
            },
            class: {
                default: null,
            },
        }
    },

    parseHTML() {
        return [
            {
                tag: 'audio',
            },
        ]
    },

    renderHTML({ HTMLAttributes }) {
        return ['audio', mergeAttributes(HTMLAttributes, { controls: true })]
    },
})

// Custom Iframe extension for Tiptap (for YouTube embeds)
export const Iframe = Node.create({
    name: 'iframe',
    group: 'block',
    atom: true,

    addAttributes() {
        return {
            src: {
                default: null,
            },
            style: {
                default: null,
            },
            class: {
                default: null,
            },
            allow: {
                default: null,
            },
            allowfullscreen: {
                default: true,
            },
        }
    },

    parseHTML() {
        return [
            {
                tag: 'iframe',
            },
        ]
    },

    renderHTML({ HTMLAttributes }) {
        return ['iframe', mergeAttributes(HTMLAttributes)]
    },
})

// Custom Div extension to preserve divs (for YouTube embed containers)
export const CustomDiv = Node.create({
    name: 'customDiv',
    group: 'block',
    content: 'block*',

    addAttributes() {
        return {
            style: {
                default: null,
            },
            class: {
                default: null,
            },
        }
    },

    parseHTML() {
        return [
            {
                tag: 'div',
            },
        ]
    },

    renderHTML({ HTMLAttributes }) {
        return ['div', mergeAttributes(HTMLAttributes), 0]
    },
})
