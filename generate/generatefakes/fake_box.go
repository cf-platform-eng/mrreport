// Code generated by counterfeiter. DO NOT EDIT.
package generatefakes

import (
	"sync"

	"github.com/cf-platform-eng/mrreport/generate"
)

type FakeBox struct {
	FindStringStub        func(string) (string, error)
	findStringMutex       sync.RWMutex
	findStringArgsForCall []struct {
		arg1 string
	}
	findStringReturns struct {
		result1 string
		result2 error
	}
	findStringReturnsOnCall map[int]struct {
		result1 string
		result2 error
	}
	invocations      map[string][][]interface{}
	invocationsMutex sync.RWMutex
}

func (fake *FakeBox) FindString(arg1 string) (string, error) {
	fake.findStringMutex.Lock()
	ret, specificReturn := fake.findStringReturnsOnCall[len(fake.findStringArgsForCall)]
	fake.findStringArgsForCall = append(fake.findStringArgsForCall, struct {
		arg1 string
	}{arg1})
	fake.recordInvocation("FindString", []interface{}{arg1})
	fake.findStringMutex.Unlock()
	if fake.FindStringStub != nil {
		return fake.FindStringStub(arg1)
	}
	if specificReturn {
		return ret.result1, ret.result2
	}
	fakeReturns := fake.findStringReturns
	return fakeReturns.result1, fakeReturns.result2
}

func (fake *FakeBox) FindStringCallCount() int {
	fake.findStringMutex.RLock()
	defer fake.findStringMutex.RUnlock()
	return len(fake.findStringArgsForCall)
}

func (fake *FakeBox) FindStringCalls(stub func(string) (string, error)) {
	fake.findStringMutex.Lock()
	defer fake.findStringMutex.Unlock()
	fake.FindStringStub = stub
}

func (fake *FakeBox) FindStringArgsForCall(i int) string {
	fake.findStringMutex.RLock()
	defer fake.findStringMutex.RUnlock()
	argsForCall := fake.findStringArgsForCall[i]
	return argsForCall.arg1
}

func (fake *FakeBox) FindStringReturns(result1 string, result2 error) {
	fake.findStringMutex.Lock()
	defer fake.findStringMutex.Unlock()
	fake.FindStringStub = nil
	fake.findStringReturns = struct {
		result1 string
		result2 error
	}{result1, result2}
}

func (fake *FakeBox) FindStringReturnsOnCall(i int, result1 string, result2 error) {
	fake.findStringMutex.Lock()
	defer fake.findStringMutex.Unlock()
	fake.FindStringStub = nil
	if fake.findStringReturnsOnCall == nil {
		fake.findStringReturnsOnCall = make(map[int]struct {
			result1 string
			result2 error
		})
	}
	fake.findStringReturnsOnCall[i] = struct {
		result1 string
		result2 error
	}{result1, result2}
}

func (fake *FakeBox) Invocations() map[string][][]interface{} {
	fake.invocationsMutex.RLock()
	defer fake.invocationsMutex.RUnlock()
	fake.findStringMutex.RLock()
	defer fake.findStringMutex.RUnlock()
	copiedInvocations := map[string][][]interface{}{}
	for key, value := range fake.invocations {
		copiedInvocations[key] = value
	}
	return copiedInvocations
}

func (fake *FakeBox) recordInvocation(key string, args []interface{}) {
	fake.invocationsMutex.Lock()
	defer fake.invocationsMutex.Unlock()
	if fake.invocations == nil {
		fake.invocations = map[string][][]interface{}{}
	}
	if fake.invocations[key] == nil {
		fake.invocations[key] = [][]interface{}{}
	}
	fake.invocations[key] = append(fake.invocations[key], args)
}

var _ generate.Box = new(FakeBox)
