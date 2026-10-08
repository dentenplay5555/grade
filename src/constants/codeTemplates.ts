export const CODE_TEMPLATES = {
  cpp17: `#include <iostream>
#include <vector>
#include <algorithm>

using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    
    // Solution implementation
    
    return 0;
}`,
  cpp20: `#include <iostream>
#include <vector>
#include <ranges>
#include <algorithm>

int main() {
    std::ios_base::sync_with_stdio(false);
    std::cin.tie(nullptr);
    
    // Solution implementation
    
    return 0;
}`,
  python3: `import sys

def solve():
    input_data = sys.stdin.read().split()
    if not input_data:
        return
    
    # Solution implementation

if __name__ == '__main__':
    solve()
`,
  java17: `import java.io.*;
import java.util.*;

public class Solution {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        StringTokenizer st;
        
        // Solution implementation
    }
}`,
  rust: `use std::io::{self, Read};

fn main() {
    let mut input = String::new();
    io::stdin().read_to_string(&mut input).unwrap();
    let mut words = input.split_whitespace();
    
    // Solution implementation
}`,
  go: `package main

import (
	"bufio"
	"fmt"
	"os"
)

func main() {
	reader := bufio.NewReader(os.Stdin)
	_ = reader
	
	// Solution implementation
}`
};
