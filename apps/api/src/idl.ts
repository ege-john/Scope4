export const idlRaw = {
  "address": "4jokhc6jDx663fiPNdyFs18ywus6KCiGZcDx4aW53duF",
  "metadata": {
    "name": "scope4",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "initialize_bundle",
      "discriminator": [
        93,
        76,
        148,
        51,
        99,
        41,
        179,
        234
      ],
      "accounts": [
        {
          "name": "bundle",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  117,
                  110,
                  100,
                  108,
                  101
                ]
              },
              {
                "kind": "arg",
                "path": "trade_id"
              }
            ]
          }
        },
        {
          "name": "importer",
          "writable": true,
          "signer": true
        },
        {
          "name": "system_program",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "trade_id",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        }
      ]
    },
    {
      "name": "submit_logistics_attestation",
      "discriminator": [
        60,
        4,
        255,
        132,
        188,
        98,
        13,
        152
      ],
      "accounts": [
        {
          "name": "logistics_attestation",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  108,
                  111,
                  103,
                  105,
                  115,
                  116,
                  105,
                  99,
                  115
                ]
              },
              {
                "kind": "arg",
                "path": "trade_id"
              }
            ]
          }
        },
        {
          "name": "bundle",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  117,
                  110,
                  100,
                  108,
                  101
                ]
              },
              {
                "kind": "arg",
                "path": "trade_id"
              }
            ]
          }
        },
        {
          "name": "logistics",
          "writable": true,
          "signer": true
        },
        {
          "name": "system_program",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "trade_id",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "quantity_confirmed_kg",
          "type": "u64"
        },
        {
          "name": "origin_confirmed",
          "type": "bool"
        },
        {
          "name": "route_confirmed",
          "type": "bool"
        },
        {
          "name": "dispatch_date",
          "type": "i64"
        }
      ]
    },
    {
      "name": "submit_seller_attestation",
      "discriminator": [
        125,
        177,
        242,
        109,
        56,
        31,
        36,
        231
      ],
      "accounts": [
        {
          "name": "seller_attestation",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  101,
                  108,
                  108,
                  101,
                  114,
                  95,
                  97,
                  116,
                  116,
                  101,
                  115,
                  116
                ]
              },
              {
                "kind": "arg",
                "path": "trade_id"
              }
            ]
          }
        },
        {
          "name": "bundle",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  117,
                  110,
                  100,
                  108,
                  101
                ]
              },
              {
                "kind": "arg",
                "path": "trade_id"
              }
            ]
          }
        },
        {
          "name": "seller",
          "writable": true,
          "signer": true
        },
        {
          "name": "system_program",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "trade_id",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "facility_id",
          "type": "string"
        },
        {
          "name": "product_type",
          "type": "u8"
        },
        {
          "name": "emissions_intensity",
          "type": "u64"
        },
        {
          "name": "methodology",
          "type": "u8"
        },
        {
          "name": "doc_bundle_hash",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        }
      ]
    },
    {
      "name": "submit_trade_record",
      "discriminator": [
        20,
        154,
        63,
        143,
        252,
        93,
        55,
        141
      ],
      "accounts": [
        {
          "name": "trade_record",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  116,
                  114,
                  97,
                  100,
                  101
                ]
              },
              {
                "kind": "arg",
                "path": "trade_id"
              }
            ]
          }
        },
        {
          "name": "bundle",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  98,
                  117,
                  110,
                  100,
                  108,
                  101
                ]
              },
              {
                "kind": "arg",
                "path": "trade_id"
              }
            ]
          }
        },
        {
          "name": "importer",
          "writable": true,
          "signer": true
        },
        {
          "name": "system_program",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "trade_id",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "quantity_kg",
          "type": "u64"
        },
        {
          "name": "origin_country",
          "type": "u8"
        },
        {
          "name": "destination_country",
          "type": "u8"
        },
        {
          "name": "doc_bundle_hash",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "ComplianceBundle",
      "discriminator": [
        75,
        96,
        41,
        95,
        201,
        170,
        149,
        12
      ]
    },
    {
      "name": "LogisticsAttestationAccount",
      "discriminator": [
        191,
        227,
        65,
        73,
        194,
        131,
        253,
        33
      ]
    },
    {
      "name": "SellerAttestationAccount",
      "discriminator": [
        10,
        205,
        142,
        134,
        202,
        131,
        202,
        9
      ]
    },
    {
      "name": "TradeRecordAccount",
      "discriminator": [
        155,
        137,
        233,
        207,
        72,
        92,
        5,
        139
      ]
    }
  ],
  "events": [
    {
      "name": "ComplianceBundleReady",
      "discriminator": [
        84,
        163,
        6,
        134,
        136,
        43,
        8,
        19
      ]
    }
  ],
  "types": [
    {
      "name": "BundleStatus",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "AwaitingParties"
          },
          {
            "name": "ReadyForProcessing"
          },
          {
            "name": "Processing"
          },
          {
            "name": "Complete"
          }
        ]
      }
    },
    {
      "name": "ComplianceBundle",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "trade_id",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "importer",
            "type": "pubkey"
          },
          {
            "name": "seller_attested",
            "type": "bool"
          },
          {
            "name": "importer_attested",
            "type": "bool"
          },
          {
            "name": "logistics_attested",
            "type": "bool"
          },
          {
            "name": "status",
            "type": {
              "defined": {
                "name": "BundleStatus"
              }
            }
          },
          {
            "name": "created_at",
            "type": "i64"
          },
          {
            "name": "ready_at",
            "type": {
              "option": "i64"
            }
          }
        ]
      }
    },
    {
      "name": "ComplianceBundleReady",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "trade_id",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "importer",
            "type": "pubkey"
          },
          {
            "name": "ready_at",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "LogisticsAttestationAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "trade_id",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "logistics",
            "type": "pubkey"
          },
          {
            "name": "quantity_confirmed_kg",
            "type": "u64"
          },
          {
            "name": "origin_confirmed",
            "type": "bool"
          },
          {
            "name": "route_confirmed",
            "type": "bool"
          },
          {
            "name": "dispatch_date",
            "type": "i64"
          },
          {
            "name": "attested_at",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "SellerAttestationAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "trade_id",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "seller",
            "type": "pubkey"
          },
          {
            "name": "product_type",
            "type": "u8"
          },
          {
            "name": "emissions_intensity",
            "type": "u64"
          },
          {
            "name": "methodology",
            "type": "u8"
          },
          {
            "name": "doc_bundle_hash",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "submitted_at",
            "type": "i64"
          },
          {
            "name": "facility_id",
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "TradeRecordAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "trade_id",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "importer",
            "type": "pubkey"
          },
          {
            "name": "quantity_kg",
            "type": "u64"
          },
          {
            "name": "origin_country",
            "type": "u8"
          },
          {
            "name": "destination_country",
            "type": "u8"
          },
          {
            "name": "doc_bundle_hash",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "submitted_at",
            "type": "i64"
          }
        ]
      }
    }
  ]
};
