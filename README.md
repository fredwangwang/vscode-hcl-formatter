# HCL Format

HCL Format helps to format Hashicorp Configuration Language, (.tf, .hcl) files. Just the standard format documentation key binding.

HCl Format uses [hclfmt](https://github.com/hashicorp/hcl/tree/main/cmd/hclfmt). The plugin bundles a precompiled hclfmt binary for linux/windows/darwin.
If you prefer to use your own compiled binary, you could change that in the configuration under `hclfmt_path` as well.

## Configuration:

`hclformat.hclfmt_path`: path to the hclfmt binary


`hclformat.levant_support`: (true) support format HCL with embeded levant syntax


## Dev Build

1. `npm install`

