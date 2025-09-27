# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - banner [ref=e4]:
      - heading "Ecological Simulation" [level=1] [ref=e5]
      - paragraph [ref=e6]: "A three-level food chain simulation: Grass → Sheep → Wolves"
    - main [ref=e7]:
      - generic [ref=e8]:
        - generic [ref=e9]:
          - button "Start" [ref=e10]
          - button "Step" [ref=e11]
          - button "Reset" [ref=e12]
        - generic [ref=e13]:
          - generic [ref=e14]:
            - generic [ref=e15]: Step
            - generic [ref=e16]: "0"
          - generic [ref=e17]:
            - generic [ref=e18]: Grass
            - generic [ref=e19]: "98"
          - generic [ref=e20]:
            - generic [ref=e21]: Sheep
            - generic [ref=e22]: "20"
          - generic [ref=e23]:
            - generic [ref=e24]: Wolves
            - generic [ref=e25]: "5"
        - generic [ref=e27]:
          - paragraph [ref=e28]:
            - strong [ref=e29]: "Legend:"
          - paragraph [ref=e30]: 🟢 Green = Grass (darker = more dense)
          - paragraph [ref=e31]: ⚪ White = Sheep
          - paragraph [ref=e32]: 🔴 Red = Wolves
          - paragraph [ref=e33]: Click Start to begin the simulation, Step to advance one step, or Reset to restart.
    - contentinfo [ref=e34]:
      - paragraph [ref=e35]: Built with Next.js, TypeScript, and array-oriented programming patterns
  - button "Open Next.js Dev Tools" [ref=e41] [cursor=pointer]:
    - img [ref=e42] [cursor=pointer]
  - alert [ref=e45]
```