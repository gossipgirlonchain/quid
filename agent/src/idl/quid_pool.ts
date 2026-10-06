/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/quid_pool.json`.
 */
export type QuidPool = {
  "address": "FGDjtQursqioxXpNRnUweoMKeGmFgpVNk1oUjK1RgqHP",
  "metadata": {
    "name": "quidPool",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Quid advance pool + reputation (Anchor / Solana port of the Odra QuidPool)"
  },
  "instructions": [
    {
      "name": "fundPool",
      "docs": [
        "Supply liquidity to the pool. Anyone may fund; the funder signs the",
        "transfer directly (Solana's equivalent of approve + transfer_from)."
      ],
      "discriminator": [
        36,
        57,
        233,
        176,
        181,
        20,
        87,
        159
      ],
      "accounts": [
        {
          "name": "funder",
          "signer": true
        },
        {
          "name": "funderToken",
          "writable": true
        },
        {
          "name": "pool",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  111,
                  108
                ]
              }
            ]
          }
        },
        {
          "name": "mint",
          "relations": [
            "pool"
          ]
        },
        {
          "name": "vault",
          "writable": true,
          "relations": [
            "pool"
          ]
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "initializePool",
      "docs": [
        "Odra `init`. Caller becomes admin (set this to the agent's wallet).",
        "`mint` is the SPL stablecoin the pool lends in."
      ],
      "discriminator": [
        95,
        180,
        10,
        172,
        84,
        174,
        232,
        40
      ],
      "accounts": [
        {
          "name": "admin",
          "writable": true,
          "signer": true
        },
        {
          "name": "mint"
        },
        {
          "name": "pool",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  111,
                  108
                ]
              }
            ]
          }
        },
        {
          "name": "vault",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  118,
                  97,
                  117,
                  108,
                  116
                ]
              }
            ]
          }
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "issueAdvance",
      "docs": [
        "Issue an advance. Agent-only. `amount` has already been risk-checked",
        "off-chain against verified income and the borrower's plan tier."
      ],
      "discriminator": [
        197,
        93,
        246,
        47,
        65,
        210,
        170,
        174
      ],
      "accounts": [
        {
          "name": "admin",
          "writable": true,
          "signer": true,
          "relations": [
            "pool"
          ]
        },
        {
          "name": "pool",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  111,
                  108
                ]
              }
            ]
          }
        },
        {
          "name": "advance",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  100,
                  118,
                  97,
                  110,
                  99,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "pool.nextId",
                "account": "pool"
              }
            ]
          }
        },
        {
          "name": "mint",
          "relations": [
            "pool"
          ]
        },
        {
          "name": "vault",
          "writable": true,
          "relations": [
            "pool"
          ]
        },
        {
          "name": "borrowerWallet",
          "docs": [
            "pinned to the `borrower` instruction argument."
          ]
        },
        {
          "name": "borrowerToken",
          "docs": [
            "The borrower's stablecoin account; created on their first advance."
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "borrowerWallet"
              },
              {
                "kind": "const",
                "value": [
                  6,
                  221,
                  246,
                  225,
                  215,
                  101,
                  161,
                  147,
                  217,
                  203,
                  225,
                  70,
                  206,
                  235,
                  121,
                  172,
                  28,
                  180,
                  133,
                  237,
                  95,
                  91,
                  55,
                  145,
                  58,
                  140,
                  245,
                  133,
                  126,
                  255,
                  0,
                  169
                ]
              },
              {
                "kind": "account",
                "path": "mint"
              }
            ],
            "program": {
              "kind": "const",
              "value": [
                140,
                151,
                37,
                143,
                78,
                36,
                137,
                241,
                187,
                61,
                16,
                41,
                20,
                142,
                13,
                131,
                11,
                90,
                19,
                153,
                218,
                255,
                16,
                132,
                4,
                142,
                123,
                216,
                219,
                233,
                248,
                89
              ]
            }
          }
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "associatedTokenProgram",
          "address": "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "borrower",
          "type": "pubkey"
        },
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "dueDate",
          "type": "u64"
        }
      ]
    },
    {
      "name": "repayAdvance",
      "docs": [
        "Settle an advance when income lands. Agent-only. Pulls the stablecoin",
        "back from the borrower (who approved the pool PDA as delegate), returns",
        "it to the pool, and bumps the borrower's reputation (no fee)."
      ],
      "discriminator": [
        247,
        119,
        157,
        136,
        70,
        66,
        200,
        20
      ],
      "accounts": [
        {
          "name": "admin",
          "writable": true,
          "signer": true,
          "relations": [
            "pool"
          ]
        },
        {
          "name": "pool",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  111,
                  111,
                  108
                ]
              }
            ]
          }
        },
        {
          "name": "advance",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  97,
                  100,
                  118,
                  97,
                  110,
                  99,
                  101
                ]
              },
              {
                "kind": "arg",
                "path": "advanceId"
              }
            ]
          }
        },
        {
          "name": "reputation",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  112,
                  117,
                  116,
                  97,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "advance.borrower",
                "account": "advance"
              }
            ]
          }
        },
        {
          "name": "mint",
          "relations": [
            "pool"
          ]
        },
        {
          "name": "vault",
          "writable": true,
          "relations": [
            "pool"
          ]
        },
        {
          "name": "borrowerToken",
          "docs": [
            "The borrower's stablecoin account, which has approved the pool PDA as delegate."
          ],
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "advanceId",
          "type": "u64"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "advance",
      "discriminator": [
        66,
        25,
        217,
        133,
        38,
        192,
        224,
        218
      ]
    },
    {
      "name": "pool",
      "discriminator": [
        241,
        154,
        109,
        4,
        17,
        177,
        109,
        188
      ]
    },
    {
      "name": "reputation",
      "discriminator": [
        55,
        148,
        90,
        71,
        68,
        183,
        193,
        28
      ]
    }
  ],
  "events": [
    {
      "name": "advanceIssued",
      "discriminator": [
        217,
        23,
        68,
        242,
        156,
        108,
        78,
        113
      ]
    },
    {
      "name": "advanceRepaid",
      "discriminator": [
        185,
        191,
        136,
        90,
        224,
        95,
        1,
        197
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "notAdmin",
      "msg": "Only the pool admin (the agent) may do this"
    },
    {
      "code": 6001,
      "name": "insufficientPool",
      "msg": "Pool has insufficient liquidity for this advance"
    },
    {
      "code": 6002,
      "name": "alreadyRepaid",
      "msg": "Advance is already repaid"
    },
    {
      "code": 6003,
      "name": "overflow",
      "msg": "Arithmetic overflow"
    }
  ],
  "types": [
    {
      "name": "advance",
      "docs": [
        "One advance against a borrower's verified future income."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "id",
            "type": "u64"
          },
          {
            "name": "borrower",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "dueDate",
            "docs": [
              "Expected income date (unix seconds)."
            ],
            "type": "u64"
          },
          {
            "name": "repaid",
            "type": "bool"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "advanceIssued",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "id",
            "type": "u64"
          },
          {
            "name": "borrower",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "advanceRepaid",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "id",
            "type": "u64"
          },
          {
            "name": "borrower",
            "type": "pubkey"
          },
          {
            "name": "newReputation",
            "type": "u32"
          }
        ]
      }
    },
    {
      "name": "pool",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "admin",
            "docs": [
              "The agent's wallet. Only it may issue/settle advances."
            ],
            "type": "pubkey"
          },
          {
            "name": "mint",
            "docs": [
              "The SPL stablecoin the pool lends in."
            ],
            "type": "pubkey"
          },
          {
            "name": "vault",
            "docs": [
              "Token account holding the pooled stablecoin (authority: this PDA)."
            ],
            "type": "pubkey"
          },
          {
            "name": "poolBalance",
            "docs": [
              "Internal accounting of pooled liquidity (mirror of the vault balance)."
            ],
            "type": "u64"
          },
          {
            "name": "nextId",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "reputation",
      "docs": [
        "Borrower reputation (the Quid score): count of repaid advances. A borrower",
        "with no account yet reads as 0, like Odra's `unwrap_or(0)`."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "borrower",
            "type": "pubkey"
          },
          {
            "name": "score",
            "type": "u32"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    }
  ]
};
