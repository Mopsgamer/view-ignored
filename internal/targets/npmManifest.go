package targets

import (
	"encoding/json"
	"errors"
)

type baseManifest struct {
	Main                 *string           `json:"main,omitempty"`
	Module               *string           `json:"module,omitempty"`
	Browser              *string           `json:"browser,omitempty"`
	Files                []string          `json:"files,omitempty"`
	Bin                  interface{}       `json:"bin,omitempty"` // string or map[string]string
	OptionalDependencies map[string]string `json:"optionalDependencies,omitempty"`
	DevDependencies      map[string]string `json:"devDependencies,omitempty"`
	Dependencies         map[string]string `json:"dependencies,omitempty"`
}

type withBundle struct {
	baseManifest
	BundleDependencies  []string  `json:"bundleDependencies,omitempty"`
	BundledDependencies *struct{} `json:"bundledDependencies,omitempty"` // should not be present
}

type withBundled struct {
	baseManifest
	BundledDependencies []string  `json:"bundledDependencies,omitempty"`
	BundleDependencies  *struct{} `json:"bundleDependencies,omitempty"` // should not be present
}

type npmManifest struct {
	baseManifest
	BundleDependencies  []string `json:"bundleDependencies,omitempty"`
	BundledDependencies []string `json:"bundledDependencies,omitempty"`
}

func NpmManifestParse(data []byte) (*npmManifest, error) {
	var manifest npmManifest
	if err := json.Unmarshal(data, &manifest); err != nil {
		return nil, err
	}
	bundlePresent := len(manifest.BundleDependencies) > 0
	bundledPresent := len(manifest.BundledDependencies) > 0

	if bundlePresent && bundledPresent {
		return nil, errors.New("manifest cannot have both bundleDependencies and bundledDependencies")
	}
	return &manifest, nil
}
